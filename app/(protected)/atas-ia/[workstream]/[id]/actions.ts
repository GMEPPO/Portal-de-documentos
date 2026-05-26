"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { updateAta, type WorkstreamId, type Contramedida } from "@/lib/workstream-atas";

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
  await requireAuth();

  try {
    await updateAta(id, {
      situacaoAtual,
      problemasIdentificados,
      contramedidas,
      proximosPassos,
      participantes,
    });

    revalidatePath(`/atas-ia/${workstream}/${id}`);
    revalidatePath(`/atas-ia/${workstream}`);

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erro ao atualizar a ata.",
    };
  }
}
