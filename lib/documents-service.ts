import { randomUUID } from "crypto";
import { mockCategories } from "@/lib/constants";
import {
  canEditDocument,
  canTransitionStatus,
  canUploadVersion,
} from "@/lib/rbac";
import type {
  AppUser,
  DocumentAuditRecord,
  DocumentCommentRecord,
  DocumentFileType,
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

const documentsStore: DocumentRecord[] = [];
const versionsStore: DocumentVersionRecord[] = [];
const commentsStore: DocumentCommentRecord[] = [];
const auditStore: DocumentAuditRecord[] = [];

function mapDocumentRow(row: any): DocumentRecord {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    categoryId: row.category_id ?? row.categoryId ?? "",
    department: row.department,
    status: row.status,
    documentType: row.document_type ?? row.documentType ?? "document",
    currentVersion: row.current_version ?? row.currentVersion,
    authorId: row.author_id ?? row.authorId,
    ownerId: row.owner_id ?? row.ownerId,
    mainFilePath: row.main_file_path ?? row.mainFilePath ?? undefined,
    previewFilePath: row.preview_file_path ?? row.previewFilePath ?? undefined,
    searchText: row.search_text ?? row.searchText ?? undefined,
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
    fileType: row.file_type ?? row.fileType ?? "document",
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

function logAudit(
  event: string,
  actorId: string,
  metadata?: Record<string, unknown> | null,
) {
  auditStore.push({
    id: randomUUID(),
    event,
    actorId,
    at: new Date().toISOString(),
    metadata: metadata ?? null,
  });
}

export function listCategories() {
  return mockCategories;
}

export async function listDocuments() {
  const supabase = createSupabaseServerClient();
  if (!supabase) return documentsStore;

  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(mapDocumentRow);
}

export async function getDocumentById(id: string) {
  const supabase = createSupabaseServerClient();
  if (!supabase) return documentsStore.find((doc) => doc.id === id) ?? null;

  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapDocumentRow(data) : null;
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
  const initialDocumentType: DocumentFileType = "document";

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
        status: "in_review",
        document_type: initialDocumentType,
        current_version: initialCurrentVersion,
        author_id: actor.id,
        owner_id: parsed.ownerId ?? actor.id,
        main_file_path: null,
        preview_file_path: null,
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
    status: "in_review",
    documentType: initialDocumentType,
    currentVersion: initialCurrentVersion,
    authorId: actor.id,
    ownerId: parsed.ownerId ?? actor.id,
    previewFilePath: undefined,
    searchText: undefined,
    tags: parsed.tags ?? [],
    internalNotes: parsed.internalNotes,
    createdAt: now,
    updatedAt: now,
  };
  documentsStore.unshift(doc);
  logAudit(`document.created:${doc.id}`, actor.id, { documentId: doc.id });
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
        document_type: parsed.documentType ?? undefined,
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
  const doc = documentsStore.find((item) => item.id === id);
  if (!doc) throw new Error("Documento no encontrado.");
  if (parsed.status && !canTransitionStatus(actor.role, doc.status, parsed.status)) {
    throw new Error("Transicion de estado no permitida.");
  }
  Object.assign(doc, parsed, { updatedAt: new Date().toISOString() });
  logAudit(`document.updated:${doc.id}`, actor.id, { documentId: doc.id });
  return doc;
}

export async function updateDocumentSearchIndex(documentId: string, searchText: string | null) {
  const normalizedSearchText = searchText?.trim() ?? "";
  const now = new Date().toISOString();
  const supabase = createSupabaseServerClient();

  if (supabase) {
    const { data, error } = await supabase
      .from("documents")
      .update({
        search_text: normalizedSearchText || null,
        search_text_updated_at: now,
        updated_at: now,
      })
      .eq("id", documentId)
      .select("*")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? mapDocumentRow(data) : null;
  }

  const doc = documentsStore.find((item) => item.id === documentId);
  if (!doc) throw new Error("Documento no encontrado.");

  doc.searchText = normalizedSearchText || undefined;
  doc.updatedAt = now;
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

  const doc = documentsStore.find((item) => item.id === documentId);
  if (!doc) throw new Error("Documento no encontrado.");
  const comment: DocumentCommentRecord = {
    id: randomUUID(),
    documentId,
    content: parsed.content,
    authorId: actor.id,
    createdAt: now,
  };
  commentsStore.push(comment);
  logAudit(`document.comment:${documentId}`, actor.id, { documentId });
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

    const versionId = randomUUID();
    const targetVersion = parsed.versionNumber;

    if (targetVersion <= (current.current_version ?? 0)) {
      throw new Error("La nueva version debe ser superior a la actual.");
    }

    const { data: versionRow, error: verErr } = await supabase
      .from("document_versions")
      .insert({
        id: versionId,
        document_id: documentId,
        version_number: targetVersion,
        file_type: parsed.fileType,
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
        document_type: parsed.fileType,
        current_version: targetVersion,
        main_file_path: parsed.filePath,
        preview_file_path: parsed.previewFilePath ?? null,
        search_text: null,
        search_text_updated_at: null,
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
      metadata: { documentId, versionId, nextVersion: targetVersion },
      created_at: now,
    });

    return mapVersionRow(versionRow);
  }

  // Fallback en memoria
  const doc = documentsStore.find((item) => item.id === documentId);
  if (!doc) throw new Error("Documento no encontrado.");
  const version: DocumentVersionRecord = {
    id: randomUUID(),
    documentId,
    versionNumber: parsed.versionNumber,
    fileType: parsed.fileType,
    changelog: parsed.changelog,
    filePath: parsed.filePath,
    createdBy: actor.id,
    createdAt: now,
  };
  if (version.versionNumber <= doc.currentVersion) {
    throw new Error("La nueva version debe ser superior a la actual.");
  }
  versionsStore.unshift(version);
  doc.currentVersion = version.versionNumber;
  doc.documentType = parsed.fileType;
  doc.mainFilePath = parsed.filePath;
  doc.previewFilePath = parsed.previewFilePath;
  doc.searchText = undefined;
  doc.updatedAt = now;
  logAudit(`document.version:${documentId}`, actor.id, {
    documentId,
    versionNumber: version.versionNumber,
    filePath: version.filePath,
  });
  return version;
}

export async function replaceCurrentVersion(
  documentId: string,
  payload: unknown,
  actor: AppUser,
): Promise<DocumentVersionRecord> {
  if (!canUploadVersion(actor.role)) {
    throw new Error("No autorizado para sustituir la version actual.");
  }

  const parsed = versionSchema.parse(payload);
  const supabase = createSupabaseServerClient();
  const now = new Date().toISOString();

  if (supabase) {
    const { data: currentDoc, error: docErr } = await supabase
      .from("documents")
      .select("id,current_version,status")
      .eq("id", documentId)
      .maybeSingle();

    if (docErr) throw new Error(docErr.message);
    if (!currentDoc) throw new Error("Documento no encontrado.");
    if (currentDoc.status !== "in_review") {
      throw new Error("Solo se puede sustituir la version actual en revision.");
    }

    const targetVersion = parsed.versionNumber;
    if (targetVersion !== (currentDoc.current_version ?? 0)) {
      throw new Error("A publicacao deve manter a versao atual do documento.");
    }

    const { data: existingRow, error: existingErr } = await supabase
      .from("document_versions")
      .select("*")
      .eq("document_id", documentId)
      .eq("version_number", targetVersion)
      .maybeSingle();

    if (existingErr) throw new Error(existingErr.message);
    if (!existingRow) {
      return addVersion(documentId, payload, actor);
    }

    const { data: updatedRow, error: updateErr } = await supabase
      .from("document_versions")
      .update({
        file_type: parsed.fileType,
        file_path: parsed.filePath,
        changelog: parsed.changelog,
        created_by: actor.id,
        created_at: now,
      })
      .eq("id", existingRow.id)
      .eq("document_id", documentId)
      .select("*")
      .single();

    if (updateErr || !updatedRow) {
      throw new Error(updateErr?.message ?? "Error al sustituir version.");
    }

    const { error: docUpdateErr } = await supabase
      .from("documents")
      .update({
        document_type: parsed.fileType,
        main_file_path: parsed.filePath,
        preview_file_path: parsed.previewFilePath ?? null,
        search_text: null,
        search_text_updated_at: null,
        updated_at: now,
      })
      .eq("id", documentId);

    if (docUpdateErr) {
      throw new Error(docUpdateErr.message);
    }

    await supabase.from("audit_logs").insert({
      id: randomUUID(),
      event: `document.version.replaced:${documentId}`,
      actor_id: actor.id,
      metadata: { documentId, versionId: existingRow.id, versionNumber: targetVersion },
      created_at: now,
    });

    return mapVersionRow(updatedRow);
  }

  const doc = documentsStore.find((item) => item.id === documentId);
  if (!doc) throw new Error("Documento no encontrado.");
  if (doc.status !== "in_review") {
    throw new Error("Solo se puede sustituir la version actual en revision.");
  }
  if (parsed.versionNumber !== doc.currentVersion) {
    throw new Error("A publicacao deve manter a versao atual do documento.");
  }

  const existing = versionsStore.find(
    (item) =>
      item.documentId === documentId && item.versionNumber === parsed.versionNumber,
  );

  if (!existing) {
    return addVersion(documentId, payload, actor);
  }

  existing.fileType = parsed.fileType;
  existing.filePath = parsed.filePath;
  existing.changelog = parsed.changelog;
  existing.createdBy = actor.id;
  existing.createdAt = now;

  doc.documentType = parsed.fileType;
  doc.mainFilePath = parsed.filePath;
  doc.previewFilePath = parsed.previewFilePath;
  doc.searchText = undefined;
  doc.updatedAt = now;

  logAudit(`document.version.replaced:${documentId}`, actor.id, {
    documentId,
    versionId: existing.id,
    versionNumber: existing.versionNumber,
    filePath: existing.filePath,
  });

  return existing;
}

export async function listDocumentHistory(documentId: string) {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return {
      versions: versionsStore.filter((item) => item.documentId === documentId),
      comments: commentsStore.filter((item) => item.documentId === documentId),
      audits: auditStore.filter((item) => item.event.includes(documentId)),
    };
  }

  const [versionsResult, commentsResult, auditsResult] = await Promise.all([
    supabase
      .from("document_versions")
      .select("*")
      .eq("document_id", documentId)
      .order("version_number", { ascending: false }),
    supabase
      .from("document_comments")
      .select("*")
      .eq("document_id", documentId)
      .order("created_at", { ascending: false }),
    supabase
      .from("audit_logs")
      .select("id,event,created_at,actor_id,metadata")
      .contains("metadata", { documentId })
      .order("created_at", { ascending: false }),
  ]);

  if (versionsResult.error) {
    throw new Error(versionsResult.error.message);
  }
  if (commentsResult.error) {
    throw new Error(commentsResult.error.message);
  }
  if (auditsResult.error) {
    throw new Error(auditsResult.error.message);
  }

  return {
    versions: (versionsResult.data ?? []).map(mapVersionRow),
    comments: (commentsResult.data ?? []).map(mapCommentRow),
    audits: (auditsResult.data ?? []).map((item) => ({
      id: item.id,
      event: item.event,
      actorId: item.actor_id,
      at: item.created_at,
      metadata: item.metadata ?? null,
    })),
  };
}

export async function deleteDocument(documentId: string, actor: AppUser) {
  if (!canEditDocument(actor.role)) {
    throw new Error("No autorizado para eliminar documentos.");
  }

  const supabase = createSupabaseServerClient();
  if (supabase) {
    const { data: currentDoc, error: docErr } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .maybeSingle();

    if (docErr) throw new Error(docErr.message);
    if (!currentDoc) throw new Error("Documento no encontrado.");

    const { data: versionRows, error: versionsErr } = await supabase
      .from("document_versions")
      .select("*")
      .eq("document_id", documentId);

    if (versionsErr) throw new Error(versionsErr.message);

    const paths = [
      currentDoc.main_file_path,
      currentDoc.preview_file_path,
      ...(versionRows ?? []).map((row) => row.file_path),
    ].filter((value): value is string => Boolean(value));

    const { error: auditErr } = await supabase
      .from("audit_logs")
      .delete()
      .contains("metadata", { documentId });

    if (auditErr) throw new Error(auditErr.message);

    const { error: deleteErr } = await supabase
      .from("documents")
      .delete()
      .eq("id", documentId);

    if (deleteErr) throw new Error(deleteErr.message);

    return {
      document: mapDocumentRow(currentDoc),
      versions: (versionRows ?? []).map(mapVersionRow),
      paths,
    };
  }

  const docIndex = documentsStore.findIndex((item) => item.id === documentId);
  if (docIndex === -1) throw new Error("Documento no encontrado.");

  const [deletedDoc] = documentsStore.splice(docIndex, 1);
  const deletedVersions = versionsStore.filter((item) => item.documentId === documentId);

  for (let index = versionsStore.length - 1; index >= 0; index -= 1) {
    if (versionsStore[index].documentId === documentId) {
      versionsStore.splice(index, 1);
    }
  }

  for (let index = commentsStore.length - 1; index >= 0; index -= 1) {
    if (commentsStore[index].documentId === documentId) {
      commentsStore.splice(index, 1);
    }
  }

  for (let index = auditStore.length - 1; index >= 0; index -= 1) {
    if (auditStore[index].metadata?.documentId === documentId) {
      auditStore.splice(index, 1);
    }
  }

  return {
    document: deletedDoc,
    versions: deletedVersions,
    paths: [
      deletedDoc.mainFilePath,
      deletedDoc.previewFilePath,
      ...deletedVersions.map((item) => item.filePath),
    ].filter((value): value is string => Boolean(value)),
  };
}

export async function deleteVersion(
  documentId: string,
  versionId: string,
  actor: AppUser,
) {
  if (!canUploadVersion(actor.role)) {
    throw new Error("No autorizado para eliminar versiones.");
  }

  const supabase = createSupabaseServerClient();
  const now = new Date().toISOString();

  if (supabase) {
    const { data: currentDoc, error: docErr } = await supabase
      .from("documents")
      .select("id,current_version")
      .eq("id", documentId)
      .maybeSingle();

    if (docErr) throw new Error(docErr.message);
    if (!currentDoc) throw new Error("Documento no encontrado.");

    const { data: versionRow, error: verErr } = await supabase
      .from("document_versions")
      .select("*")
      .eq("id", versionId)
      .eq("document_id", documentId)
      .maybeSingle();

    if (verErr) throw new Error(verErr.message);
    if (!versionRow) throw new Error("Version no encontrada.");
    if (versionRow.version_number === currentDoc.current_version) {
      throw new Error("No se puede eliminar la version actual del documento.");
    }

    const { error: delErr } = await supabase
      .from("document_versions")
      .delete()
      .eq("id", versionId)
      .eq("document_id", documentId);

    if (delErr) throw new Error(delErr.message);

    await supabase.from("audit_logs").insert({
      id: randomUUID(),
      event: `document.version.deleted:${documentId}`,
      actor_id: actor.id,
      metadata: {
        documentId,
        versionId,
        versionNumber: versionRow.version_number,
        filePath: versionRow.file_path,
      },
      created_at: now,
    });

    return mapVersionRow(versionRow);
  }

  const doc = documentsStore.find((item) => item.id === documentId);
  if (!doc) throw new Error("Documento no encontrado.");
  const index = versionsStore.findIndex(
    (item) => item.id === versionId && item.documentId === documentId,
  );
  if (index === -1) throw new Error("Version no encontrada.");
  if (versionsStore[index].versionNumber === doc.currentVersion) {
    throw new Error("No se puede eliminar la version actual del documento.");
  }
  const [deleted] = versionsStore.splice(index, 1);
  logAudit(`document.version.deleted:${documentId}`, actor.id, {
    documentId,
    versionId: deleted.id,
    versionNumber: deleted.versionNumber,
    filePath: deleted.filePath,
  });
  return deleted;
}
