import { randomUUID } from "crypto";
import { mockCategories, mockDocuments } from "@/lib/constants";
import {
  canEditDocument,
  canTransitionStatus,
  canUploadVersion,
} from "@/lib/rbac";
import type {
  AppUser,
  DocumentCommentRecord,
  DocumentRecord,
  DocumentVersionRecord,
} from "@/lib/types";
import {
  commentSchema,
  documentCreateSchema,
  documentUpdateSchema,
  versionSchema,
} from "@/lib/validations";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const documentsStore = [...mockDocuments];
const versionsStore: DocumentVersionRecord[] = [];
const commentsStore: DocumentCommentRecord[] = [];
const auditStore: { id: string; event: string; at: string; actorId: string }[] = [];

function mapDocumentRow(row: any): DocumentRecord {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    categoryId: row.category_id ?? row.categoryId ?? "",
    department: row.department,
    status: row.status,
    currentVersion: row.current_version ?? row.currentVersion,
    authorId: row.author_id ?? row.authorId,
    ownerId: row.owner_id ?? row.ownerId,
    mainFilePath: row.main_file_path ?? row.mainFilePath ?? undefined,
    tags: row.tags ?? [],
    internalNotes: row.internal_notes ?? row.internalNotes ?? undefined,
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt,
  };
}

function looksLikeUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function mapVersionRow(row: any): DocumentVersionRecord {
  return {
    id: row.id,
    documentId: row.document_id ?? row.documentId,
    versionNumber: row.version_number ?? row.versionNumber,
    filePath: row.file_path ?? row.filePath,
    changelog: row.changelog,
    createdBy: row.created_by ?? row.createdBy,
    createdAt: row.created_at ?? row.createdAt,
  };
}

function mapCommentRow(row: any): DocumentCommentRecord {
  return {
    id: row.id,
    documentId: row.document_id ?? row.documentId,
    content: row.content,
    authorId: row.author_id ?? row.authorId,
    createdAt: row.created_at ?? row.createdAt,
  };
}

function logAudit(event: string, actorId: string) {
  auditStore.push({ id: randomUUID(), event, actorId, at: new Date().toISOString() });
}

export function listCategories() {
  return mockCategories;
}

export function listDocuments() {
  const supabase = createSupabaseServerClient();
  if (!supabase) return documentsStore;

  // Nota: para la UI actual, devolvemos todos (filtros futuros se añaden luego).
  // Al tratarse de RLS, el resultado dependerá del rol/policies.
  // Para evitar convertir en async la API pública existente, seguimos con fallback en memoria.
  return documentsStore;
}

export function getDocumentById(id: string) {
  const supabase = createSupabaseServerClient();
  if (!supabase) return documentsStore.find((doc) => doc.id === id) ?? null;

  // Idéntica limitación que listDocuments(): mantener firma sync.
  return documentsStore.find((doc) => doc.id === id) ?? null;
}

export async function createDocument(
  payload: unknown,
  actor: AppUser,
  opts?: { initialVersionNumber?: number | null },
): Promise<DocumentRecord> {
  if (!canEditDocument(actor.role)) {
    throw new Error("No autorizado para crear documentos.");
  }
  const parsed = documentCreateSchema.parse(payload);
  const now = new Date().toISOString();

  const supabase = createSupabaseServerClient();
  const docId = randomUUID();
  const parsedInitialVersion =
    opts?.initialVersionNumber && opts.initialVersionNumber > 0
      ? opts.initialVersionNumber
      : null;
  const initialCurrentVersion =
    parsedInitialVersion !== null ? parsedInitialVersion - 1 : 0;

  if (supabase) {
    // Persistencia en DB
    const { data, error } = await supabase
      .from("documents")
      .insert({
        id: docId,
        title: parsed.title,
        summary: parsed.summary,
        // La UI actual usa IDs demo. Para no bloquear inserts por FK uuid,
        // si no es UUID real, lo guardamos como NULL.
        category_id: looksLikeUuid(parsed.categoryId) ? parsed.categoryId : null,
        department: parsed.department,
        status: "draft",
        current_version: initialCurrentVersion,
        author_id: actor.id,
        owner_id: parsed.ownerId,
        main_file_path: null,
        tags: parsed.tags ?? [],
        internal_notes: parsed.internalNotes ?? null,
        created_at: now,
        updated_at: now,
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(
        error?.message ?? "Error al guardar el documento en la base.",
      );
    }

    // Auditoría mínima
    await supabase.from("audit_logs").insert({
      id: randomUUID(),
      event: `document.created:${docId}`,
      actor_id: actor.id,
      metadata: { documentId: docId },
      created_at: now,
    });

    return mapDocumentRow(data);
  }

  // Fallback (sin Supabase o en tests)
  const doc: DocumentRecord = {
    id: docId,
    title: parsed.title,
    summary: parsed.summary,
    categoryId: parsed.categoryId,
    department: parsed.department,
    status: "draft",
    currentVersion: initialCurrentVersion,
    authorId: actor.id,
    ownerId: parsed.ownerId,
    tags: parsed.tags ?? [],
    internalNotes: parsed.internalNotes,
    createdAt: now,
    updatedAt: now,
  };
  documentsStore.unshift(doc);
  logAudit(`document.created:${doc.id}`, actor.id);
  return doc;
}

export async function updateDocument(
  id: string,
  payload: unknown,
  actor: AppUser,
): Promise<DocumentRecord> {
  if (!canEditDocument(actor.role)) {
    throw new Error("No autorizado para editar.");
  }
  const parsed = documentUpdateSchema.parse(payload);

  const supabase = createSupabaseServerClient();
  if (supabase) {
    // Leemos estado actual (para validar transiciones)
    const { data: current } = await supabase
      .from("documents")
      .select("id,status,current_version")
      .eq("id", id)
      .maybeSingle();

    if (!current) throw new Error("Documento no encontrado.");
    if (parsed.status && !canTransitionStatus(actor.role, current.status, parsed.status)) {
      throw new Error("Transicion de estado no permitida.");
    }

    const now = new Date().toISOString();
    const { data: updated, error } = await supabase
      .from("documents")
      .update({
        title: parsed.title ?? undefined,
        summary: parsed.summary ?? undefined,
        category_id:
          parsed.categoryId && typeof parsed.categoryId === "string"
            ? looksLikeUuid(parsed.categoryId)
              ? parsed.categoryId
              : null
            : undefined,
        department: parsed.department ?? undefined,
        status: parsed.status ?? undefined,
        tags: parsed.tags ?? undefined,
        internal_notes: parsed.internalNotes ?? undefined,
        updated_at: now,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !updated) {
      throw new Error(error?.message ?? "Error al actualizar documento.");
    }

    await supabase.from("audit_logs").insert({
      id: randomUUID(),
      event: `document.updated:${id}`,
      actor_id: actor.id,
      metadata: { documentId: id },
      created_at: now,
    });

    return mapDocumentRow(updated);
  }

  // Fallback en memoria
  const doc = getDocumentById(id);
  if (!doc) throw new Error("Documento no encontrado.");
  if (parsed.status && !canTransitionStatus(actor.role, doc.status, parsed.status)) {
    throw new Error("Transicion de estado no permitida.");
  }
  Object.assign(doc, parsed, { updatedAt: new Date().toISOString() });
  logAudit(`document.updated:${doc.id}`, actor.id);
  return doc;
}

export async function addComment(
  documentId: string,
  payload: unknown,
  actor: AppUser,
): Promise<DocumentCommentRecord> {
  const parsed = commentSchema.parse(payload);

  const supabase = createSupabaseServerClient();
  const now = new Date().toISOString();
  if (supabase) {
    // Confirmamos existencia del documento en la DB (en vez de depender del fallback en memoria)
    const { data: currentDoc } = await supabase
      .from("documents")
      .select("id")
      .eq("id", documentId)
      .maybeSingle();
    if (!currentDoc) throw new Error("Documento no encontrado.");

    const commentId = randomUUID();
    const { data, error } = await supabase
      .from("document_comments")
      .insert({
        id: commentId,
        document_id: documentId,
        content: parsed.content,
        author_id: actor.id,
        created_at: now,
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Error al guardar comentario.");
    }

    await supabase.from("audit_logs").insert({
      id: randomUUID(),
      event: `document.comment:${documentId}`,
      actor_id: actor.id,
      metadata: { documentId, commentId },
      created_at: now,
    });

    return mapCommentRow(data);
  }

  const doc = getDocumentById(documentId);
  if (!doc) throw new Error("Documento no encontrado.");
  const comment: DocumentCommentRecord = {
    id: randomUUID(),
    documentId,
    content: parsed.content,
    authorId: actor.id,
    createdAt: now,
  };
  commentsStore.push(comment);
  logAudit(`document.comment:${documentId}`, actor.id);
  return comment;
}

export async function addVersion(
  documentId: string,
  payload: unknown,
  actor: AppUser,
): Promise<DocumentVersionRecord> {
  if (!canUploadVersion(actor.role)) {
    throw new Error("No autorizado para subir versiones.");
  }
  const parsed = versionSchema.parse(payload);

  const supabase = createSupabaseServerClient();
  const now = new Date().toISOString();

  if (supabase) {
    // Leemos current_version real para versionado consistente
    const { data: current } = await supabase
      .from("documents")
      .select("id,current_version")
      .eq("id", documentId)
      .maybeSingle();

    if (!current) throw new Error("Documento no encontrado.");

    const nextVersion = (current.current_version ?? 0) + 1;
    const versionId = randomUUID();

    const { data: versionRow, error: verErr } = await supabase
      .from("document_versions")
      .insert({
        id: versionId,
        document_id: documentId,
        version_number: nextVersion,
        file_path: parsed.filePath,
        changelog: parsed.changelog,
        created_by: actor.id,
        created_at: now,
      })
      .select("*")
      .single();

    if (verErr || !versionRow) {
      throw new Error(verErr?.message ?? "Error al guardar version.");
    }

    const { error: updErr } = await supabase
      .from("documents")
      .update({
        current_version: nextVersion,
        main_file_path: parsed.filePath,
        updated_at: now,
      })
      .eq("id", documentId);

    if (updErr) {
      throw new Error(updErr.message);
    }

    await supabase.from("audit_logs").insert({
      id: randomUUID(),
      event: `document.version:${documentId}`,
      actor_id: actor.id,
      metadata: { documentId, versionId, nextVersion },
      created_at: now,
    });

    return mapVersionRow(versionRow);
  }

  // Fallback en memoria
  const doc = getDocumentById(documentId);
  if (!doc) throw new Error("Documento no encontrado.");
  const version: DocumentVersionRecord = {
    id: randomUUID(),
    documentId,
    versionNumber: doc.currentVersion + 1,
    changelog: parsed.changelog,
    filePath: parsed.filePath,
    createdBy: actor.id,
    createdAt: now,
  };
  versionsStore.unshift(version);
  doc.currentVersion = version.versionNumber;
  doc.mainFilePath = parsed.filePath;
  doc.updatedAt = now;
  logAudit(`document.version:${documentId}`, actor.id);
  return version;
}

export function listDocumentHistory(documentId: string) {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return {
      versions: versionsStore.filter((item) => item.documentId === documentId),
      comments: commentsStore.filter((item) => item.documentId === documentId),
      audits: auditStore.filter((item) => item.event.includes(documentId)),
    };
  }

  // Para mantener firma sync, usamos fallback en memoria para ahora.
  // (En el siguiente paso podemos convertir estas funciones a async y actualizar route handlers/UI.)
  return {
    versions: versionsStore.filter((item) => item.documentId === documentId),
    comments: commentsStore.filter((item) => item.documentId === documentId),
    audits: auditStore.filter((item) => item.event.includes(documentId)),
  };
}
