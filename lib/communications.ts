import { createSupabaseServiceServerClient } from "@/lib/supabase-service-server";
import {
  communicationDraftSchema,
  type CommunicationDraft,
} from "@/lib/validations";
import type {
  AppUser,
  CommunicationAttachmentRecord,
  CommunicationRecipientRecord,
  CommunicationRecord,
  CommunicationStatus,
} from "@/lib/types";

function getServiceClient() {
  const supabase = createSupabaseServiceServerClient();
  if (!supabase) {
    throw new Error("Supabase service role não configurada.");
  }
  return supabase;
}

function mapCommunication(row: any): CommunicationRecord {
  return {
    id: row.id,
    documentId: row.document_id,
    subject: row.subject,
    message: row.message,
    sentBy: row.sent_by,
    sentAt: row.sent_at,
    n8nStatus: row.n8n_status as CommunicationStatus,
    n8nError: row.n8n_error ?? null,
    recipientCount: row.recipient_count ?? 0,
    tagsSnapshot: row.tags_snapshot ?? [],
    departmentsSnapshot: row.departments_snapshot ?? [],
  };
}

function mapRecipient(row: any): CommunicationRecipientRecord {
  return {
    id: row.id,
    communicationId: row.communication_id,
    userId: row.user_id ?? null,
    email: row.email,
    name: row.name ?? null,
    department: row.department ?? null,
  };
}

function mapAttachment(row: any): CommunicationAttachmentRecord {
  return {
    id: row.id,
    communicationId: row.communication_id,
    storagePath: row.storage_path,
    fileName: row.file_name,
    mimeType: row.mime_type ?? null,
    sizeBytes: row.size_bytes ?? null,
    createdAt: row.created_at,
  };
}

export type ResolvedRecipient = {
  userId: string;
  name: string;
  email: string;
  department: string;
};

export type RecipientResolution = {
  recipients: ResolvedRecipient[];
  tags: string[];
  departments: string[];
};

/**
 * Resolve os destinatários de uma comunicação a partir do documento:
 *   documents.tags[] → document_tags.name → document_tags.department → users(department)
 * Tags sem departamento são ignoradas. Utilizadores são deduplicados por id.
 */
export async function resolveRecipientsForDocument(
  documentId: string,
): Promise<RecipientResolution> {
  const supabase = getServiceClient();

  const { data: doc, error: docError } = await supabase
    .from("documents")
    .select("id, tags")
    .eq("id", documentId)
    .single();
  if (docError) throw new Error(docError.message);
  if (!doc) throw new Error("Documento não encontrado.");

  const tags: string[] = Array.isArray(doc.tags) ? doc.tags : [];
  if (tags.length === 0) {
    return { recipients: [], tags: [], departments: [] };
  }

  const { data: tagRows, error: tagsError } = await supabase
    .from("document_tags")
    .select("name, department")
    .in("name", tags);
  if (tagsError) throw new Error(tagsError.message);

  const departments = Array.from(
    new Set(
      (tagRows ?? [])
        .map((row: any) => (typeof row.department === "string" ? row.department.trim() : ""))
        .filter((d: string) => d.length > 0),
    ),
  );

  if (departments.length === 0) {
    return { recipients: [], tags, departments: [] };
  }

  const { data: userRows, error: usersError } = await supabase
    .from("users")
    .select("id, name, email, department")
    .in("department", departments);
  if (usersError) throw new Error(usersError.message);

  const dedup = new Map<string, ResolvedRecipient>();
  for (const row of userRows ?? []) {
    if (!row?.email) continue;
    if (!dedup.has(row.id)) {
      dedup.set(row.id, {
        userId: row.id,
        name: row.name ?? "",
        email: row.email,
        department: row.department ?? "",
      });
    }
  }

  return {
    recipients: Array.from(dedup.values()),
    tags,
    departments,
  };
}

export type CreatedCommunication = {
  id: string;
  recipientCount: number;
  recipients: ResolvedRecipient[];
  tagsSnapshot: string[];
  departmentsSnapshot: string[];
};

/**
 * Cria a row de comunicação com estado 'pending' + snapshot de destinatários e anexos.
 * NÃO chama o n8n — esse passo é feito pela server action depois de garantir consistência.
 */
export async function createCommunication(
  draft: CommunicationDraft,
  actor: AppUser,
): Promise<CreatedCommunication> {
  const parsed = communicationDraftSchema.parse(draft);
  const supabase = getServiceClient();

  const resolution = await resolveRecipientsForDocument(parsed.documentId);
  if (resolution.recipients.length === 0) {
    throw new Error(
      "Sem destinatários para esta comunicação. Verifica que pelo menos uma tag do documento tem departamento atribuído.",
    );
  }

  const { data: commRow, error: commError } = await supabase
    .from("communications")
    .insert({
      document_id: parsed.documentId,
      subject: parsed.subject,
      message: parsed.message,
      sent_by: actor.id,
      n8n_status: "pending",
      recipient_count: resolution.recipients.length,
      tags_snapshot: resolution.tags,
      departments_snapshot: resolution.departments,
    })
    .select("id")
    .single();
  if (commError || !commRow) {
    throw new Error(commError?.message ?? "Falha ao criar comunicação.");
  }

  const communicationId = commRow.id as string;

  const recipientPayload = resolution.recipients.map((r) => ({
    communication_id: communicationId,
    user_id: r.userId,
    email: r.email,
    name: r.name,
    department: r.department,
  }));
  const { error: recipientsError } = await supabase
    .from("communication_recipients")
    .insert(recipientPayload);
  if (recipientsError) {
    throw new Error(recipientsError.message);
  }

  if (parsed.attachments.length > 0) {
    const attachmentsPayload = parsed.attachments.map((a) => ({
      communication_id: communicationId,
      storage_path: a.storagePath,
      file_name: a.fileName,
      mime_type: a.mimeType ?? null,
      size_bytes: a.sizeBytes ?? null,
    }));
    const { error: attachError } = await supabase
      .from("communication_attachments")
      .insert(attachmentsPayload);
    if (attachError) {
      throw new Error(attachError.message);
    }
  }

  return {
    id: communicationId,
    recipientCount: resolution.recipients.length,
    recipients: resolution.recipients,
    tagsSnapshot: resolution.tags,
    departmentsSnapshot: resolution.departments,
  };
}

export async function markCommunicationStatus(
  id: string,
  status: CommunicationStatus,
  error?: string | null,
) {
  const supabase = getServiceClient();
  const { error: updateError } = await supabase
    .from("communications")
    .update({ n8n_status: status, n8n_error: error ?? null })
    .eq("id", id);
  if (updateError) throw new Error(updateError.message);
}

export async function listCommunicationsForDocument(documentId: string) {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("communications")
    .select("*")
    .eq("document_id", documentId)
    .order("sent_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapCommunication);
}

export async function listCommunications(opts?: { search?: string; limit?: number }) {
  const supabase = getServiceClient();
  let q = supabase
    .from("communications")
    .select("*")
    .order("sent_at", { ascending: false })
    .limit(opts?.limit ?? 100);
  if (opts?.search && opts.search.trim()) {
    q = q.ilike("subject", `%${opts.search.trim()}%`);
  }
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapCommunication);
}

export type CommunicationDetail = {
  communication: CommunicationRecord;
  recipients: CommunicationRecipientRecord[];
  attachments: CommunicationAttachmentRecord[];
};

export async function getCommunication(id: string): Promise<CommunicationDetail | null> {
  const supabase = getServiceClient();
  const [{ data: comm, error: cErr }, { data: rec, error: rErr }, { data: att, error: aErr }] =
    await Promise.all([
      supabase.from("communications").select("*").eq("id", id).maybeSingle(),
      supabase.from("communication_recipients").select("*").eq("communication_id", id),
      supabase
        .from("communication_attachments")
        .select("*")
        .eq("communication_id", id)
        .order("created_at", { ascending: true }),
    ]);
  if (cErr) throw new Error(cErr.message);
  if (rErr) throw new Error(rErr.message);
  if (aErr) throw new Error(aErr.message);
  if (!comm) return null;

  return {
    communication: mapCommunication(comm),
    recipients: (rec ?? []).map(mapRecipient),
    attachments: (att ?? []).map(mapAttachment),
  };
}
