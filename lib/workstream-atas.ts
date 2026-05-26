import { createSupabaseServiceServerClient } from "@/lib/supabase-service-server";
import type { AppUser } from "@/lib/types";

export type WorkstreamId = "ws1" | "ws2" | "ws3" | "ws4";

export const VALID_WORKSTREAMS: WorkstreamId[] = ["ws1", "ws2", "ws3", "ws4"];

export const WORKSTREAM_LABELS: Record<WorkstreamId, string> = {
  ws1: "Workstream 1",
  ws2: "Workstream 2",
  ws3: "Workstream 3",
  ws4: "Workstream 4",
};

export type Contramedida = {
  action: string;
  owner: string;
  deadline: string;
};

export type WorkstreamAtaRecord = {
  id: string;
  workstream: WorkstreamId;
  meetingDate: string;
  transcript: string | null;
  situacaoAtual: string;
  problemasIdentificados: string;
  contramedidas: Contramedida[];
  proximosPassos: string;
  participantes: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AtaInput = {
  workstream: WorkstreamId;
  meetingDate: string;
  transcript?: string | null;
  situacaoAtual: string;
  problemasIdentificados: string;
  contramedidas: Contramedida[];
  proximosPassos: string;
  participantes: string;
};

function getServiceClient() {
  const supabase = createSupabaseServiceServerClient();
  if (!supabase) throw new Error("Supabase service role não configurada.");
  return supabase;
}

function mapRow(row: any): WorkstreamAtaRecord {
  return {
    id: row.id,
    workstream: row.workstream as WorkstreamId,
    meetingDate: row.meeting_date,
    transcript: row.transcript ?? null,
    situacaoAtual: row.situacao_atual ?? "",
    problemasIdentificados: row.problemas_identificados ?? "",
    contramedidas: Array.isArray(row.contramedidas) ? (row.contramedidas as Contramedida[]) : [],
    proximosPassos: row.proximos_passos ?? "",
    participantes: row.participantes ?? "",
    createdBy: row.created_by ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getLastAtaForWorkstream(
  workstream: WorkstreamId,
): Promise<WorkstreamAtaRecord | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("workstream_atas")
    .select("*")
    .eq("workstream", workstream)
    .order("meeting_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapRow(data) : null;
}

export async function listAtasForWorkstream(
  workstream: WorkstreamId,
): Promise<WorkstreamAtaRecord[]> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("workstream_atas")
    .select("*")
    .eq("workstream", workstream)
    .order("meeting_date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
}

export async function getAta(id: string): Promise<WorkstreamAtaRecord | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("workstream_atas")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapRow(data) : null;
}

export async function createAta(
  input: AtaInput,
  actor: AppUser,
): Promise<WorkstreamAtaRecord> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("workstream_atas")
    .insert({
      workstream: input.workstream,
      meeting_date: input.meetingDate,
      transcript: input.transcript ?? null,
      situacao_atual: input.situacaoAtual,
      problemas_identificados: input.problemasIdentificados,
      contramedidas: input.contramedidas,
      proximos_passos: input.proximosPassos,
      participantes: input.participantes,
      created_by: actor.id,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Falha ao criar ata.");
  return mapRow(data);
}

export async function updateAta(
  id: string,
  input: Omit<AtaInput, "workstream" | "meetingDate" | "transcript">,
): Promise<WorkstreamAtaRecord> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("workstream_atas")
    .update({
      situacao_atual: input.situacaoAtual,
      problemas_identificados: input.problemasIdentificados,
      contramedidas: input.contramedidas,
      proximos_passos: input.proximosPassos,
      participantes: input.participantes,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Falha ao atualizar ata.");
  return mapRow(data);
}

export async function getLastAtasForAllWorkstreams(): Promise<
  Record<WorkstreamId, WorkstreamAtaRecord | null>
> {
  const supabase = getServiceClient();
  const results = await Promise.all(
    VALID_WORKSTREAMS.map((ws) =>
      supabase
        .from("workstream_atas")
        .select("id, workstream, meeting_date, situacao_atual, created_at, updated_at, problemas_identificados, proximos_passos, participantes, contramedidas, transcript, created_by")
        .eq("workstream", ws)
        .order("meeting_date", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ),
  );
  const map = {} as Record<WorkstreamId, WorkstreamAtaRecord | null>;
  VALID_WORKSTREAMS.forEach((ws, i) => {
    map[ws] = results[i].data ? mapRow(results[i].data) : null;
  });
  return map;
}
