import { createSupabaseServiceServerClient } from "@/lib/supabase-service-server";
import { eventInputSchema, type EventInput } from "@/lib/validations";
import type {
  AppUser,
  EventAttendeeRecord,
  EventDocumentLink,
  EventDocumentRole,
  EventKind,
  EventRecord,
} from "@/lib/types";

function getServiceClient() {
  const supabase = createSupabaseServiceServerClient();
  if (!supabase) throw new Error("Supabase service role não configurada.");
  return supabase;
}

function mapEvent(row: any): EventRecord {
  return {
    id: row.id,
    subject: row.subject,
    description: row.description ?? null,
    kind: row.kind as EventKind,
    startsAt: row.starts_at,
    endsAt: row.ends_at ?? null,
    location: row.location ?? null,
    isOnline: !!row.is_online,
    onlineUrl: row.online_url ?? null,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDocumentLink(row: any): EventDocumentLink {
  return {
    eventId: row.event_id,
    documentId: row.document_id,
    role: row.role as EventDocumentRole,
  };
}

function mapAttendee(row: any): EventAttendeeRecord {
  return {
    eventId: row.event_id,
    userId: row.user_id,
    createdAt: row.created_at,
  };
}

async function syncEventDocuments(
  eventId: string,
  documentIds: string[],
  minutesIds: string[],
) {
  const supabase = getServiceClient();
  await supabase.from("event_documents").delete().eq("event_id", eventId);

  const minutesSet = new Set(minutesIds);
  const allIds = new Set<string>([...documentIds, ...minutesIds]);
  const rows = Array.from(allIds).map((id) => ({
    event_id: eventId,
    document_id: id,
    role: minutesSet.has(id) ? "minutes" : "related",
  }));
  if (rows.length === 0) return;
  const { error } = await supabase.from("event_documents").insert(rows);
  if (error) throw new Error(error.message);
}

async function syncAttendees(eventId: string, userIds: string[]) {
  const supabase = getServiceClient();
  await supabase.from("event_attendees").delete().eq("event_id", eventId);
  if (userIds.length === 0) return;
  const rows = Array.from(new Set(userIds)).map((id) => ({
    event_id: eventId,
    user_id: id,
  }));
  const { error } = await supabase.from("event_attendees").insert(rows);
  if (error) throw new Error(error.message);
}

export async function createEvent(input: EventInput, actor: AppUser): Promise<EventRecord> {
  const parsed = eventInputSchema.parse(input);
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("events")
    .insert({
      subject: parsed.subject,
      description: parsed.description ?? null,
      kind: parsed.kind,
      starts_at: new Date(parsed.startsAt).toISOString(),
      ends_at: parsed.endsAt ? new Date(parsed.endsAt).toISOString() : null,
      location: parsed.location ?? null,
      is_online: parsed.isOnline,
      online_url: parsed.onlineUrl ?? null,
      created_by: actor.id,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "Falha ao criar evento.");
  }

  await syncEventDocuments(data.id, parsed.documentIds, parsed.minutesDocumentIds);
  await syncAttendees(data.id, parsed.attendeeIds);

  return mapEvent(data);
}

export async function updateEvent(
  id: string,
  input: EventInput,
): Promise<EventRecord> {
  const parsed = eventInputSchema.parse(input);
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("events")
    .update({
      subject: parsed.subject,
      description: parsed.description ?? null,
      kind: parsed.kind,
      starts_at: new Date(parsed.startsAt).toISOString(),
      ends_at: parsed.endsAt ? new Date(parsed.endsAt).toISOString() : null,
      location: parsed.location ?? null,
      is_online: parsed.isOnline,
      online_url: parsed.onlineUrl ?? null,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "Falha ao atualizar evento.");
  }

  await syncEventDocuments(id, parsed.documentIds, parsed.minutesDocumentIds);
  await syncAttendees(id, parsed.attendeeIds);

  return mapEvent(data);
}

export async function deleteEvent(id: string) {
  const supabase = getServiceClient();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listEvents(opts?: {
  from?: string;
  to?: string;
  documentId?: string;
  kind?: EventKind;
}) {
  const supabase = getServiceClient();

  if (opts?.documentId) {
    const { data: linkRows, error: linkErr } = await supabase
      .from("event_documents")
      .select("event_id")
      .eq("document_id", opts.documentId);
    if (linkErr) throw new Error(linkErr.message);
    const ids = Array.from(new Set((linkRows ?? []).map((r: any) => r.event_id)));
    if (ids.length === 0) return [];
    let q = supabase
      .from("events")
      .select("*")
      .in("id", ids)
      .order("starts_at", { ascending: false });
    if (opts.from) q = q.gte("starts_at", opts.from);
    if (opts.to) q = q.lte("starts_at", opts.to);
    if (opts.kind) q = q.eq("kind", opts.kind);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapEvent);
  }

  let q = supabase.from("events").select("*").order("starts_at", { ascending: false });
  if (opts?.from) q = q.gte("starts_at", opts.from);
  if (opts?.to) q = q.lte("starts_at", opts.to);
  if (opts?.kind) q = q.eq("kind", opts.kind);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapEvent);
}

export async function listEventsForDocument(documentId: string): Promise<EventRecord[]> {
  return listEvents({ documentId });
}

export type EventDetail = {
  event: EventRecord;
  documents: EventDocumentLink[];
  attendees: EventAttendeeRecord[];
};

export async function getEvent(id: string): Promise<EventDetail | null> {
  const supabase = getServiceClient();
  const [{ data: ev, error: eErr }, { data: docs, error: dErr }, { data: att, error: aErr }] =
    await Promise.all([
      supabase.from("events").select("*").eq("id", id).maybeSingle(),
      supabase.from("event_documents").select("*").eq("event_id", id),
      supabase.from("event_attendees").select("*").eq("event_id", id),
    ]);
  if (eErr) throw new Error(eErr.message);
  if (dErr) throw new Error(dErr.message);
  if (aErr) throw new Error(aErr.message);
  if (!ev) return null;
  return {
    event: mapEvent(ev),
    documents: (docs ?? []).map(mapDocumentLink),
    attendees: (att ?? []).map(mapAttendee),
  };
}

/** Helpers expostos para testes unitários */
export function assertEventLocationOrOnline(input: Pick<EventInput, "isOnline" | "location">) {
  if (!input.isOnline && (!input.location || input.location.trim() === "")) {
    throw new Error("Indica a localização ou marca como online.");
  }
  return true;
}

export function assertEventDates(input: Pick<EventInput, "startsAt" | "endsAt">) {
  if (!input.endsAt) return true;
  const start = new Date(input.startsAt).getTime();
  const end = new Date(input.endsAt).getTime();
  if (Number.isFinite(start) && Number.isFinite(end) && end < start) {
    throw new Error("Fim deve ser posterior ao início.");
  }
  return true;
}
