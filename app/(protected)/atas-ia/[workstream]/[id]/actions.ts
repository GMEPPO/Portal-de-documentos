"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { updateAta, getAta, deleteAta, type WorkstreamId, type Contramedida } from "@/lib/workstream-atas";
import { syncAtaToDocument, addAtaDocumentVersion } from "@/lib/ata-document-sync";
import { deleteDocument } from "@/lib/documents-service";
import { deleteDocumentFiles } from "@/lib/storage-service";
import { createSupabaseServiceServerClient } from "@/lib/supabase-service-server";

export type UpdateAtaResult = { ok: true } | { ok: false; error: string };
export type DeleteAtaResult = { ok: true } | { ok: false; error: string };

export async function deleteAtaAction(
  id: string,
  workstream: WorkstreamId,
): Promise<DeleteAtaResult> {
  const actor = await requireAuth();
  if (actor.role !== "admin") {
    return { ok: false, error: "Só administradores podem eliminar atas." };
  }

  try {
    // 1. Ler a ata antes de apagar para obter documentId e poder limpar o documento
    const ata = await getAta(id);
    const documentId = ata?.documentId ?? null;

    // 2. Apagar PDFs do storage (pasta atas/{ataId}/)
    const supabase = createSupabaseServiceServerClient();
    if (supabase) {
      const { data: files } = await supabase.storage
        .from("documents")
        .list(`atas/${id}`);
      if (files && files.length > 0) {
        const paths = files.map((f) => `atas/${id}/${f.name}`);
        await supabase.storage.from("documents").remove(paths);
      }
    }

    // 3. Apagar o documento associado (e os seus ficheiros no storage)
    if (documentId) {
      try {
        const deleted = await deleteDocument(documentId, actor);
        await deleteDocumentFiles(deleted.paths);
      } catch {
        /* Se o documento já foi apagado, continua */
      }
    }

    // 4. Apagar a ata
    await deleteAta(id);

    revalidatePath("/atas-ia");
    revalidatePath(`/atas-ia/${workstream}`);
    revalidatePath("/documents");

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erro ao eliminar a ata.",
    };
  }
}

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
