"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { updateAta, getAta, type WorkstreamId, type Contramedida } from "@/lib/workstream-atas";
import { syncAtaToDocument, addAtaDocumentVersion } from "@/lib/ata-document-sync";

export type UpdateAtaResult = { ok: true } | { ok: false; error: string };

export async function updateAtaAction(
  id: string,
  workstream: WorkstreamId,
  situacaoAtual: string,
  problemasIdentificados: string,
  contramedidas: Contramedida[],
  proximosPassos: string,
  participantes: string,
): Promise<UpdateAtaResult> {
  const actor = await requireAuth();

  try {
    // Ler document_id ANTES do update para garantir valor correcto
    // (não depender do retorno do UPDATE que pode ter variações de timing)
    const existing = await getAta(id);
    const existingDocumentId = existing?.documentId ?? null;

    const updated = await updateAta(id, {
      situacaoAtual,
      problemasIdentificados,
      contramedidas,
      proximosPassos,
      participantes,
    });

    // Sincronizar com o sistema de documentos
    if (existingDocumentId) {
      // Ata já tem documento associado → adicionar nova versão
      await addAtaDocumentVersion(updated, existingDocumentId, actor);
    } else {
      // Ata ainda não tem documento (criada antes desta funcionalidade) → criar agora
      await syncAtaToDocument(updated, actor);
    }

    revalidatePath(`/atas-ia/${workstream}/${id}`);
    revalidatePath(`/atas-ia/${workstream}`);
    revalidatePath("/documents");

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erro ao atualizar a ata.",
    };
  }
}
