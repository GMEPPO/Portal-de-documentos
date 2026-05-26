"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import {
  getLastAtaForWorkstream,
  createAta,
  type WorkstreamId,
  type Contramedida,
} from "@/lib/workstream-atas";

export type GenerateAtaFieldsResult =
  | {
      ok: true;
      situacaoAtual: string;
      problemasIdentificados: string;
      contramedidas: Contramedida[];
      proximosPassos: string;
      participantes: string;
    }
  | { ok: false; error: string };

/**
 * Envia a transcrição + ata anterior ao n8n e recebe os 5 campos pré-preenchidos.
 * O n8n lê a ata anterior como contexto e gera o resumo estruturado da nova reunião.
 */
export async function generateAtaFieldsAction(
  workstream: WorkstreamId,
  meetingDate: string,
  transcript: string,
): Promise<GenerateAtaFieldsResult> {
  await requireAuth();

  const webhookUrl = process.env.N8N_ATAS_WEBHOOK_URL;
  if (!webhookUrl) {
    return {
      ok: false,
      error: "Webhook n8n não configurado (N8N_ATAS_WEBHOOK_URL em falta). Contacta o administrador.",
    };
  }

  // Obter ata anterior para contexto
  let previousAta: Record<string, unknown> | null = null;
  try {
    const last = await getLastAtaForWorkstream(workstream);
    if (last) {
      previousAta = {
        meeting_date: last.meetingDate,
        situacao_atual: last.situacaoAtual,
        problemas_identificados: last.problemasIdentificados,
        contramedidas: last.contramedidas,
        proximos_passos: last.proximosPassos,
        participantes: last.participantes,
      };
    }
  } catch {
    /* sem contexto anterior — o agente gera sem histórico */
  }

  let response: Response;
  try {
    response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        workstream,
        meeting_date: meetingDate,
        transcript: transcript.trim(),
        previous_ata: previousAta,
      }),
      signal: AbortSignal.timeout(300_000), // 5 min
    });
  } catch (err) {
    const msg =
      err instanceof Error
        ? err.name === "TimeoutError"
          ? "O serviço demorou demasiado tempo. Tenta novamente."
          : err.message
        : "Erro de ligação ao serviço de geração de atas.";
    return { ok: false, error: msg };
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    return {
      ok: false,
      error: body || `O serviço devolveu um erro (estado ${response.status}).`,
    };
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    return { ok: false, error: "A resposta do serviço não é JSON válido." };
  }

  if (typeof data !== "object" || data === null) {
    return { ok: false, error: "Formato de resposta inesperado." };
  }

  const d = data as Record<string, unknown>;

  return {
    ok: true,
    situacaoAtual: typeof d.situacao_atual === "string" ? d.situacao_atual : "",
    problemasIdentificados:
      typeof d.problemas_identificados === "string" ? d.problemas_identificados : "",
    contramedidas: Array.isArray(d.contramedidas) ? (d.contramedidas as Contramedida[]) : [],
    proximosPassos: typeof d.proximos_passos === "string" ? d.proximos_passos : "",
    participantes: typeof d.participantes === "string" ? d.participantes : "",
  };
}

export type SaveAtaResult = { ok: true; id: string } | { ok: false; error: string };

/**
 * Guarda a ata no banco de dados após o utilizador ter revisto e editado os campos.
 */
export async function saveAtaAction(
  workstream: WorkstreamId,
  meetingDate: string,
  transcript: string,
  situacaoAtual: string,
  problemasIdentificados: string,
  contramedidas: Contramedida[],
  proximosPassos: string,
  participantes: string,
): Promise<SaveAtaResult> {
  const actor = await requireAuth();

  try {
    const ata = await createAta(
      {
        workstream,
        meetingDate,
        transcript: transcript || null,
        situacaoAtual,
        problemasIdentificados,
        contramedidas,
        proximosPassos,
        participantes,
      },
      actor,
    );

    revalidatePath(`/atas-ia/${workstream}`);
    revalidatePath("/atas-ia");

    return { ok: true, id: ata.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erro ao guardar a ata.",
    };
  }
}
