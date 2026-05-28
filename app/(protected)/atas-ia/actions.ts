"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import {
  listAtasForWorkstream,
  getAta,
  createAta,
  getLastAtaForWorkstream,
  type WorkstreamId,
  type Contramedida,
} from "@/lib/workstream-atas";
import { syncAtaToDocument } from "@/lib/ata-document-sync";

// ---------------------------------------------------------------------------
// Tipo resumido para o seletor de ata de referência
// ---------------------------------------------------------------------------
export type AtaRef = {
  id: string;
  meetingDate: string;
  situacaoAtual: string;
};

export type ListRecentAtasResult =
  | { ok: true; atas: AtaRef[] }
  | { ok: false; error: string };

/**
 * Devolve as últimas 5 atas de um workstream (apenas os campos necessários
 * para mostrar no seletor de referência).
 */
export async function listRecentAtasAction(
  workstream: WorkstreamId,
): Promise<ListRecentAtasResult> {
  await requireAuth();
  try {
    const rows = await listAtasForWorkstream(workstream);
    const atas: AtaRef[] = rows.slice(0, 5).map((r) => ({
      id: r.id,
      meetingDate: r.meetingDate,
      situacaoAtual: r.situacaoAtual,
    }));
    return { ok: true, atas };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro ao carregar atas.",
    };
  }
}

// ---------------------------------------------------------------------------
// Geração de campos via n8n
// ---------------------------------------------------------------------------
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

export async function generateAtaFieldsAction(
  workstream: WorkstreamId,
  meetingDate: string,
  transcript: string,
  referenceAtaId: string | null,
): Promise<GenerateAtaFieldsResult> {
  await requireAuth();

  const webhookUrl = process.env.N8N_ATAS_WEBHOOK_URL;
  if (!webhookUrl) {
    return {
      ok: false,
      error: "Webhook n8n não configurado (N8N_ATAS_WEBHOOK_URL em falta). Contacta o administrador.",
    };
  }

  // Buscar a ata de referência escolhida pelo utilizador (ou null)
  let previousAta: Record<string, unknown> | null = null;
  if (referenceAtaId) {
    try {
      const ref = await getAta(referenceAtaId);
      if (ref) {
        previousAta = {
          meeting_date: ref.meetingDate,
          situacao_atual: ref.situacaoAtual,
          problemas_identificados: ref.problemasIdentificados,
          contramedidas: ref.contramedidas,
          proximos_passos: ref.proximosPassos,
          participantes: ref.participantes,
        };
      }
    } catch {
      /* sem contexto anterior */
    }
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
      signal: AbortSignal.timeout(300_000),
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
    return { ok: false, error: body || `Erro do serviço (estado ${response.status}).` };
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

  // Aceita tanto { situacao_atual: ... } como [{ situacao_atual: ... }]
  const d = (Array.isArray(data) ? data[0] : data) as Record<string, unknown>;

  if (!d || typeof d !== "object") {
    return { ok: false, error: "Formato de resposta inesperado." };
  }

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

// ---------------------------------------------------------------------------
// Guardar ata
// ---------------------------------------------------------------------------
export type SaveAtaResult =
  | { ok: true; id: string }
  | { ok: false; error: string; existingId?: string };

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

    // Sincronizar com o sistema de documentos (não bloqueia em caso de erro)
    await syncAtaToDocument(ata, actor);

    revalidatePath("/atas-ia");
    revalidatePath("/documents");

    return { ok: true, id: ata.id };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";

    // Violação do unique index (workstream + meeting_date)
    if (msg.includes("workstream_atas_ws_date_idx")) {
      // Encontra o id da ata existente para oferecer link directo
      let existingId: string | undefined;
      try {
        const existing = await getLastAtaForWorkstream(workstream);
        if (existing && existing.meetingDate === meetingDate) {
          existingId = existing.id;
        }
      } catch {
        /* ignora */
      }
      return {
        ok: false,
        error: `Já existe uma ata para ${workstream.toUpperCase()} na data ${meetingDate}. Altera a data ou edita a ata existente.`,
        existingId,
      };
    }

    return {
      ok: false,
      error: msg || "Erro ao guardar a ata.",
    };
  }
}
