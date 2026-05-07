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
  DocumentProcessingStatus,
  DocumentRecord,
  DocumentVersionFileRecord,
  DocumentVersionRecord,
} from "@/lib/types";
import {
  commentSchema,
  documentCreateSchema,
  documentUpdateSchema,
  versionSchema,
  type VersionFileInput,
} from "@/lib/validations";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const documentsStore: DocumentRecord[] = [];
const versionsStore: DocumentVersionRecord[] = [];
const commentsStore: DocumentCommentRecord[] = [];
const auditStore: DocumentAuditRecord[] = [];

function isMissingSearchIndexColumnError(message?: string | null) {
  const m = (message ?? "").toLowerCase();
  return m.includes("search_text") || m.includes("search_text_updated_at");
}

function isMissingProcessingColumnError(message?: string | null) {
  const m = (message ?? "").toLowerCase();
  return (
    m.includes("preview_status") ||
    m.includes("search_status") ||
    m.includes("preview_error") ||
    m.includes("search_error")
  );
}

function shouldIgnoreOptionalDocumentColumnError(message?: string | null) {
  return isMissingSearchIndexColumnError(message) || isMissingProcessingColumnError(message);
}

function mapDocumentRow(row: any): DocumentRecord {
  const ownerName =
    typeof row.owner?.name === "string"
      ? row.owner.name
      : typeof row.owner_name === "string"
        ? row.owner_name
        : typeof row.ownerName === "string"
          ? row.ownerName
          : undefined;

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
    ownerName,
    previewFilePath: row.preview_file_path ?? row.previewFilePath ?? undefined,
    searchText: row.search_text ?? row.searchText ?? undefined,
    previewStatus: row.preview_status ?? row.previewStatus ?? "skipped",
    searchStatus: row.search_status ?? row.searchStatus ?? "skipped",
    previewError: row.preview_error ?? row.previewError ?? undefined,
    searchError: row.search_error ?? row.searchError ?? undefined,
    tags: row.tags ?? [],
    internalNotes: row.internal_notes ?? row.internalNotes ?? undefined,
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt,
  };
}

function looksLikeUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function mapVersionRow(row: any, files?: DocumentVersionFileRecord[]): DocumentVersionRecord {
  return {
    id: row.id,
    documentId: row.document_id ?? row.documentId,
    versionNumber: row.version_number ?? row.versionNumber,
    changelog: row.changelog,
    createdBy: row.created_by ?? row.createdBy,
    createdAt: row.created_at ?? row.createdAt,
    files: files ?? [],
  };
}

function mapVersionFileRow(row: any): DocumentVersionFileRecord {
  return {
    id: row.id,
    versionId: row.version_id ?? row.versionId,
    fileType: row.file_type ?? row.fileType ?? "document",
    filePath: row.file_path ?? row.filePath,
    originalName: row.original_name ?? row.originalName ?? "",
    sortOrder: row.sort_order ?? row.sortOrder ?? 0,
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

function logAudit(event: string, actorId: string, metadata?: Record<string, unknown> | null) {
  auditStore.push({ id: randomUUID(), event, actorId, at: new Date().toISOString(), metadata: metadata ?? null });
}

export function listCategories() {
  return mockCategories;
}

export async function listDocuments() {
  const supabase = createSupabaseServerClient();
  if (!supabase) return documentsStore;

  const { data, error } = await supabase
    .from("documents")
    .select("*, owner:users!documents_owner_id_fkey(id,name)")
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapDocumentRow);
}

export async function getDocumentById(id: string) {
  const supabase = createSupabaseServerClient();
  if (!supabase) return documentsStore.find((doc) => doc.id === id) ?? null;

  const { data, error } = await supabase
    .from("documents")
    .select("*, owner:users!documents_owner_id_fkey(id,name)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapDocumentRow(data) : null;
}

export async function createDocument(
  payload: unknown,
  actor: AppUser,
  opts?: { initialVersionNumber?: number | null },
): Promise<DocumentRecord> {
  if (!canEditDocument(actor.role)) throw new Error("Não autorizado para criar documentos.");
  const parsed = documentCreateSchema.parse(payload);
  const now = new Date().toISOString();
  const supabase = createSupabaseServerClient();
  const docId = randomUUID();
  const parsedInitialVersion =
    opts?.initialVersionNumber && opts.initialVersionNumber > 0 ? opts.initialVersionNumber : null;
  const initialCurrentVersion = parsedInitialVersion !== null ? parsedInitialVersion - 1 : 0;

  if (supabase) {
    const { data, error } = await supabase
      .from("documents")
      .insert({
        id: docId,
        title: parsed.title,
        summary: parsed.summary,
        category_id: looksLikeUuid(parsed.categoryId) ? parsed.categoryId : null,
        department: parsed.department,
        status: "in_review",
        current_version: initialCurrentVersion,
        author_id: actor.id,
        owner_id: parsed.ownerId ?? actor.id,
        preview_file_path: null,
        preview_status: "skipped",
        search_status: "skipped",
        preview_error: null,
        search_error: null,
        tags: parsed.tags ?? [],
        internal_notes: parsed.internalNotes ?? null,
        created_at: now,
        updated_at: now,
      })
      .select("*")
      .single();

    if (error && shouldIgnoreOptionalDocumentColumnError(error.message)) {
      const fallback = await supabase
        .from("documents")
        .insert({
          id: docId,
          title: parsed.title,
          summary: parsed.summary,
          category_id: looksLikeUuid(parsed.categoryId) ? parsed.categoryId : null,
          department: parsed.department,
          status: "in_review",
          current_version: initialCurrentVersion,
          author_id: actor.id,
          owner_id: parsed.ownerId ?? actor.id,
          preview_file_path: null,
          tags: parsed.tags ?? [],
          internal_notes: parsed.internalNotes ?? null,
          created_at: now,
          updated_at: now,
        })
        .select("*")
        .single();

      if (fallback.error || !fallback.data) {
        throw new Error(fallback.error?.message ?? "Erro ao guardar o documento.");
      }

      await supabase.from("audit_logs").insert({
        id: randomUUID(),
        event: `document.created:${docId}`,
        actor_id: actor.id,
        metadata: { documentId: docId },
        created_at: now,
      });

      return mapDocumentRow(fallback.data);
    }

    if (error || !data) throw new Error(error?.message ?? "Erro ao guardar o documento.");

    await supabase.from("audit_logs").insert({
      id: randomUUID(),
      event: `document.created:${docId}`,
      actor_id: actor.id,
      metadata: { documentId: docId },
      created_at: now,
    });

    return mapDocumentRow(data);
  }

  const doc: DocumentRecord = {
    id: docId,
    title: parsed.title,
    summary: parsed.summary,
    categoryId: parsed.categoryId,
    department: parsed.department,
    status: "in_review",
    currentVersion: initialCurrentVersion,
    authorId: actor.id,
    ownerId: parsed.ownerId ?? actor.id,
    previewFilePath: undefined,
    searchText: undefined,
    previewStatus: "skipped",
    searchStatus: "skipped",
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
  if (!canEditDocument(actor.role)) throw new Error("Não autorizado para editar.");
  const parsed = documentUpdateSchema.parse(payload);
  const supabase = createSupabaseServerClient();

  if (supabase) {
    const { data: current } = await supabase
      .from("documents")
      .select("id,status,current_version")
      .eq("id", id)
      .maybeSingle();

    if (!current) throw new Error("Documento não encontrado.");
    if (parsed.status && !canTransitionStatus(actor.role, current.status, parsed.status)) {
      throw new Error("Transição de estado não permitida.");
    }

    const now = new Date().toISOString();
    const { data: updated, error } = await supabase
      .from("documents")
      .update({
        title: parsed.title ?? undefined,
        summary: parsed.summary ?? undefined,
        category_id:
          parsed.categoryId && typeof parsed.categoryId === "string"
            ? looksLikeUuid(parsed.categoryId) ? parsed.categoryId : null
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

    if (error || !updated) throw new Error(error?.message ?? "Erro ao atualizar documento.");

    await supabase.from("audit_logs").insert({
      id: randomUUID(),
      event: `document.updated:${id}`,
      actor_id: actor.id,
      metadata: { documentId: id },
      created_at: now,
    });

    return mapDocumentRow(updated);
  }

  const doc = documentsStore.find((item) => item.id === id);
  if (!doc) throw new Error("Documento não encontrado.");
  if (parsed.status && !canTransitionStatus(actor.role, doc.status, parsed.status)) {
    throw new Error("Transição de estado não permitida.");
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
      if (isMissingSearchIndexColumnError(error.message)) return getDocumentById(documentId);
      throw new Error(error.message);
    }

    return data ? mapDocumentRow(data) : null;
  }

  const doc = documentsStore.find((item) => item.id === documentId);
  if (!doc) throw new Error("Documento não encontrado.");
  doc.searchText = normalizedSearchText || undefined;
  doc.updatedAt = now;
  return doc;
}

export async function updateDocumentProcessingState(
  documentId: string,
  state: {
    previewStatus?: DocumentProcessingStatus;
    searchStatus?: DocumentProcessingStatus;
    previewError?: string | null;
    searchError?: string | null;
    previewFilePath?: string | null;
    searchText?: string | null;
  },
) {
  const now = new Date().toISOString();
  const supabase = createSupabaseServerClient();

  if (supabase) {
    const { data, error } = await supabase
      .from("documents")
      .update({
        preview_status: state.previewStatus,
        search_status: state.searchStatus,
        preview_error: state.previewError,
        search_error: state.searchError,
        preview_file_path: state.previewFilePath,
        search_text: state.searchText,
        search_text_updated_at: state.searchText !== undefined ? (state.searchText ? now : null) : undefined,
        updated_at: now,
      })
      .eq("id", documentId)
      .select("*")
      .maybeSingle();

    if (error) {
      if (shouldIgnoreOptionalDocumentColumnError(error.message)) return getDocumentById(documentId);
      throw new Error(error.message);
    }

    return data ? mapDocumentRow(data) : null;
  }

  const doc = documentsStore.find((item) => item.id === documentId);
  if (!doc) throw new Error("Documento não encontrado.");
  if (state.previewStatus !== undefined) doc.previewStatus = state.previewStatus;
  if (state.searchStatus !== undefined) doc.searchStatus = state.searchStatus;
  if (state.previewError !== undefined) doc.previewError = state.previewError ?? undefined;
  if (state.searchError !== undefined) doc.searchError = state.searchError ?? undefined;
  if (state.previewFilePath !== undefined) doc.previewFilePath = state.previewFilePath ?? undefined;
  if (state.searchText !== undefined) doc.searchText = state.searchText ?? undefined;
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
    const { data: currentDoc } = await supabase
      .from("documents")
      .select("id")
      .eq("id", documentId)
      .maybeSingle();
    if (!currentDoc) throw new Error("Documento não encontrado.");

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

    if (error || !data) throw new Error(error?.message ?? "Erro ao guardar comentário.");

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
  if (!doc) throw new Error("Documento não encontrado.");
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
  files: VersionFileInput[],
): Promise<DocumentVersionRecord> {
  if (!canUploadVersion(actor.role)) throw new Error("Não autorizado para adicionar versões.");
  const parsed = versionSchema.parse(payload);
  const supabase = createSupabaseServerClient();
  const now = new Date().toISOString();

  if (supabase) {
    const { data: current } = await supabase
      .from("documents")
      .select("id,current_version")
      .eq("id", documentId)
      .maybeSingle();

    if (!current) throw new Error("Documento não encontrado.");
    const targetVersion = parsed.versionNumber;

    // Verifica o número de versão máximo real em document_versions
    // (pode divergir de current_version em caso de estado inconsistente)
    const { data: maxVersionRow } = await supabase
      .from("document_versions")
      .select("version_number")
      .eq("document_id", documentId)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    const actualMaxVersion = Math.max(
      current.current_version ?? 0,
      maxVersionRow?.version_number ?? 0,
    );

    if (targetVersion <= actualMaxVersion) {
      throw new Error(`A nova versão (${targetVersion}) deve ser superior à versão existente (${actualMaxVersion}).`);
    }

    const versionId = randomUUID();
    const { data: versionRow, error: verErr } = await supabase
      .from("document_versions")
      .insert({
        id: versionId,
        document_id: documentId,
        version_number: targetVersion,
        changelog: parsed.changelog,
        created_by: actor.id,
        created_at: now,
      })
      .select("*")
      .single();

    if (verErr || !versionRow) throw new Error(verErr?.message ?? "Erro ao guardar versão.");

    const fileRows = files.map((f, i) => ({
      id: randomUUID(),
      version_id: versionId,
      file_type: f.fileType,
      file_path: f.filePath,
      original_name: f.originalName,
      sort_order: f.sortOrder ?? i,
      created_at: now,
    }));

    if (fileRows.length > 0) {
      const { error: filesErr } = await supabase
        .from("document_version_files")
        .insert(fileRows);
      if (filesErr) throw new Error(filesErr.message);
    }

    // Determina o ficheiro primário (primeiro tipo "document", ou o primeiro)
    const primaryFile = files.find((f) => f.fileType === "document") ?? files[0];
    const hasPdfForSearch = primaryFile?.fileType === "document" &&
      primaryFile.originalName.toLowerCase().endsWith(".pdf");

    const docUpdatePayload: Record<string, unknown> = {
      current_version: targetVersion,
      search_text: null,
      search_text_updated_at: null,
      preview_status: "skipped",
      search_status: hasPdfForSearch ? "pending" : "skipped",
      preview_error: null,
      search_error: null,
      updated_at: now,
    };

    let { error: updErr } = await supabase
      .from("documents")
      .update(docUpdatePayload)
      .eq("id", documentId);

    if (updErr && shouldIgnoreOptionalDocumentColumnError(updErr.message)) {
      ({ error: updErr } = await supabase
        .from("documents")
        .update({ current_version: targetVersion, updated_at: now })
        .eq("id", documentId));
    }

    if (updErr) throw new Error(updErr.message);

    await supabase.from("audit_logs").insert({
      id: randomUUID(),
      event: `document.version:${documentId}`,
      actor_id: actor.id,
      metadata: { documentId, versionId, nextVersion: targetVersion },
      created_at: now,
    });

    return mapVersionRow(versionRow, fileRows.map(mapVersionFileRow));
  }

  const doc = documentsStore.find((item) => item.id === documentId);
  if (!doc) throw new Error("Documento não encontrado.");
  const version: DocumentVersionRecord = {
    id: randomUUID(),
    documentId,
    versionNumber: parsed.versionNumber,
    changelog: parsed.changelog,
    createdBy: actor.id,
    createdAt: now,
    files: files.map((f, i) => ({
      id: randomUUID(),
      versionId: "",
      fileType: f.fileType,
      filePath: f.filePath,
      originalName: f.originalName,
      sortOrder: f.sortOrder ?? i,
      createdAt: now,
    })),
  };
  if (version.versionNumber <= doc.currentVersion) {
    throw new Error("A nova versão deve ser superior à atual.");
  }
  versionsStore.unshift(version);
  doc.currentVersion = version.versionNumber;
  doc.updatedAt = now;
  logAudit(`document.version:${documentId}`, actor.id, { documentId, versionNumber: version.versionNumber });
  return version;
}

export async function replaceCurrentVersion(
  documentId: string,
  payload: unknown,
  actor: AppUser,
  files: VersionFileInput[],
): Promise<DocumentVersionRecord> {
  if (!canUploadVersion(actor.role)) throw new Error("Não autorizado para substituir a versão atual.");
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
    if (!currentDoc) throw new Error("Documento não encontrado.");
    if (currentDoc.status !== "in_review") {
      throw new Error("Só é possível substituir a versão atual em revisão.");
    }

    const targetVersion = parsed.versionNumber;
    if (targetVersion !== (currentDoc.current_version ?? 0)) {
      throw new Error("A publicação deve manter a versão atual do documento.");
    }

    const { data: existingRow } = await supabase
      .from("document_versions")
      .select("*")
      .eq("document_id", documentId)
      .eq("version_number", targetVersion)
      .maybeSingle();

    let versionId: string;
    let versionRow: any;

    if (!existingRow) {
      versionId = randomUUID();
      const { data: insertedRow, error: insertErr } = await supabase
        .from("document_versions")
        .insert({
          id: versionId,
          document_id: documentId,
          version_number: targetVersion,
          changelog: parsed.changelog,
          created_by: actor.id,
          created_at: now,
        })
        .select("*")
        .single();

      if (insertErr || !insertedRow) throw new Error(insertErr?.message ?? "Erro ao criar versão em revisão.");
      versionRow = insertedRow;
    } else {
      versionId = existingRow.id;
      const { data: updatedRow, error: updateErr } = await supabase
        .from("document_versions")
        .update({ changelog: parsed.changelog, created_by: actor.id, created_at: now })
        .eq("id", existingRow.id)
        .select("*")
        .single();

      if (updateErr || !updatedRow) throw new Error(updateErr?.message ?? "Erro ao substituir versão.");
      versionRow = updatedRow;

      // Apaga ficheiros anteriores desta versão
      await supabase.from("document_version_files").delete().eq("version_id", versionId);
    }

    const fileRows = files.map((f, i) => ({
      id: randomUUID(),
      version_id: versionId,
      file_type: f.fileType,
      file_path: f.filePath,
      original_name: f.originalName,
      sort_order: f.sortOrder ?? i,
      created_at: now,
    }));

    if (fileRows.length > 0) {
      const { error: filesErr } = await supabase
        .from("document_version_files")
        .insert(fileRows);
      if (filesErr) throw new Error(filesErr.message);
    }

    const primaryFile = files.find((f) => f.fileType === "document") ?? files[0];
    const hasPdfForSearch = primaryFile?.fileType === "document" &&
      primaryFile.originalName.toLowerCase().endsWith(".pdf");

    const replacePayload: Record<string, unknown> = {
      search_text: null,
      search_text_updated_at: null,
      preview_status: "skipped",
      search_status: hasPdfForSearch ? "pending" : "skipped",
      preview_error: null,
      search_error: null,
      updated_at: now,
    };

    let { error: docUpdateErr } = await supabase
      .from("documents")
      .update(replacePayload)
      .eq("id", documentId);

    if (docUpdateErr && shouldIgnoreOptionalDocumentColumnError(docUpdateErr.message)) {
      ({ error: docUpdateErr } = await supabase
        .from("documents")
        .update({ updated_at: now })
        .eq("id", documentId));
    }

    if (docUpdateErr) throw new Error(docUpdateErr.message);

    await supabase.from("audit_logs").insert({
      id: randomUUID(),
      event: `document.version.replaced:${documentId}`,
      actor_id: actor.id,
      metadata: { documentId, versionId, versionNumber: targetVersion },
      created_at: now,
    });

    return mapVersionRow(versionRow, fileRows.map(mapVersionFileRow));
  }

  const doc = documentsStore.find((item) => item.id === documentId);
  if (!doc) throw new Error("Documento não encontrado.");
  if (doc.status !== "in_review") throw new Error("Só é possível substituir a versão atual em revisão.");
  if (parsed.versionNumber !== doc.currentVersion) throw new Error("A publicação deve manter a versão atual.");

  const existing = versionsStore.find(
    (item) => item.documentId === documentId && item.versionNumber === parsed.versionNumber,
  );

  const now2 = now;
  const vFiles = files.map((f, i) => ({
    id: randomUUID(),
    versionId: existing?.id ?? "",
    fileType: f.fileType,
    filePath: f.filePath,
    originalName: f.originalName,
    sortOrder: f.sortOrder ?? i,
    createdAt: now2,
  }));

  if (!existing) {
    const created: DocumentVersionRecord = {
      id: randomUUID(),
      documentId,
      versionNumber: parsed.versionNumber,
      changelog: parsed.changelog,
      createdBy: actor.id,
      createdAt: now2,
      files: vFiles,
    };
    versionsStore.unshift(created);
    doc.updatedAt = now2;
    return created;
  }

  existing.changelog = parsed.changelog;
  existing.createdBy = actor.id;
  existing.createdAt = now2;
  existing.files = vFiles;
  doc.updatedAt = now2;
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

  const [versionsResult, filesResult, commentsResult, auditsResult] = await Promise.all([
    supabase
      .from("document_versions")
      .select("*")
      .eq("document_id", documentId)
      .order("version_number", { ascending: false }),
    supabase
      .from("document_version_files")
      .select("*")
      .in(
        "version_id",
        (
          await supabase
            .from("document_versions")
            .select("id")
            .eq("document_id", documentId)
        ).data?.map((v: any) => v.id) ?? [],
      )
      .order("sort_order", { ascending: true }),
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

  if (versionsResult.error) throw new Error(versionsResult.error.message);
  if (commentsResult.error) throw new Error(commentsResult.error.message);
  if (auditsResult.error) throw new Error(auditsResult.error.message);

  const filesByVersion = new Map<string, DocumentVersionFileRecord[]>();
  for (const row of filesResult.data ?? []) {
    const f = mapVersionFileRow(row);
    if (!filesByVersion.has(f.versionId)) filesByVersion.set(f.versionId, []);
    filesByVersion.get(f.versionId)!.push(f);
  }

  return {
    versions: (versionsResult.data ?? []).map((row) =>
      mapVersionRow(row, filesByVersion.get(row.id) ?? []),
    ),
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
  if (!canEditDocument(actor.role)) throw new Error("Não autorizado para eliminar documentos.");

  const supabase = createSupabaseServerClient();
  if (supabase) {
    const { data: currentDoc, error: docErr } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .maybeSingle();

    if (docErr) throw new Error(docErr.message);
    if (!currentDoc) throw new Error("Documento não encontrado.");

    const { data: versionRows, error: versionsErr } = await supabase
      .from("document_versions")
      .select("id")
      .eq("document_id", documentId);

    if (versionsErr) throw new Error(versionsErr.message);

    const versionIds = (versionRows ?? []).map((v: any) => v.id);

    const paths: string[] = [];
    if (currentDoc.preview_file_path) paths.push(currentDoc.preview_file_path);

    if (versionIds.length > 0) {
      const { data: fileRows } = await supabase
        .from("document_version_files")
        .select("file_path")
        .in("version_id", versionIds);

      for (const row of fileRows ?? []) {
        if (row.file_path) paths.push(row.file_path);
      }
    }

    await supabase.from("audit_logs").delete().contains("metadata", { documentId });
    const { error: deleteErr } = await supabase.from("documents").delete().eq("id", documentId);
    if (deleteErr) throw new Error(deleteErr.message);

    return { document: mapDocumentRow(currentDoc), paths };
  }

  const docIndex = documentsStore.findIndex((item) => item.id === documentId);
  if (docIndex === -1) throw new Error("Documento não encontrado.");
  const [deletedDoc] = documentsStore.splice(docIndex, 1);

  for (let i = versionsStore.length - 1; i >= 0; i -= 1) {
    if (versionsStore[i].documentId === documentId) versionsStore.splice(i, 1);
  }
  for (let i = commentsStore.length - 1; i >= 0; i -= 1) {
    if (commentsStore[i].documentId === documentId) commentsStore.splice(i, 1);
  }
  for (let i = auditStore.length - 1; i >= 0; i -= 1) {
    if (auditStore[i].metadata?.documentId === documentId) auditStore.splice(i, 1);
  }

  return {
    document: deletedDoc,
    paths: [deletedDoc.previewFilePath].filter((v): v is string => Boolean(v)),
  };
}

export type PatchDocumentVersionOptions = {
  /** Texto do registo de alterações; omitir para não alterar (útil com substituição só de ficheiros). */
  changelog?: string;
  /** Novos ficheiros da versão; substitui a lista existente quando não está vazio. */
  files?: VersionFileInput[];
  /** IDs de ficheiros existentes a eliminar (sem substituição). */
  deleteFileIds?: string[];
};

/**
 * Administradores podem corrigir o registo de alterações e substituir os ficheiros de qualquer versão.
 */
export async function patchDocumentVersion(
  documentId: string,
  versionId: string,
  actor: AppUser,
  opts: PatchDocumentVersionOptions,
): Promise<{ version: DocumentVersionRecord; obsoleteFilePaths: string[] }> {
  if (!canEditDocument(actor.role)) throw new Error("Não autorizado para alterar versões.");

  const rawChangelog = opts.changelog?.trim();
  const files = opts.files ?? [];
  const deleteFileIds = opts.deleteFileIds ?? [];
  const willUpdateChangelog = rawChangelog !== undefined && rawChangelog.length > 0;
  if (willUpdateChangelog && rawChangelog.length < 3) {
    throw new Error("O registo de alterações deve ter pelo menos 3 caracteres.");
  }
  if (!willUpdateChangelog && files.length === 0 && deleteFileIds.length === 0) {
    throw new Error("Indica um registo de alterações ou selecciona novos ficheiros.");
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
    if (!currentDoc) throw new Error("Documento não encontrado.");

    const { data: versionRow, error: verErr } = await supabase
      .from("document_versions")
      .select("*")
      .eq("id", versionId)
      .eq("document_id", documentId)
      .maybeSingle();

    if (verErr) throw new Error(verErr.message);
    if (!versionRow) throw new Error("Versão não encontrada.");

    const obsoleteFilePaths: string[] = [];
    let fileRecords: DocumentVersionFileRecord[] = [];

    if (deleteFileIds.length > 0 || files.length > 0) {
      const { data: allFiles, error: listErr } = await supabase
        .from("document_version_files")
        .select("*")
        .eq("version_id", versionId)
        .order("sort_order", { ascending: true });

      if (listErr) throw new Error(listErr.message);
      const existingFiles = allFiles ?? [];

      if (deleteFileIds.length > 0) {
        const afterDelete = existingFiles.filter((f) => !deleteFileIds.includes(f.id));
        if (afterDelete.length === 0 && files.length === 0) {
          throw new Error("Não é possível eliminar todos os ficheiros sem adicionar novos.");
        }
        for (const r of existingFiles.filter((f) => deleteFileIds.includes(f.id))) {
          if (r.file_path) obsoleteFilePaths.push(r.file_path);
        }
        const { error: delErr } = await supabase
          .from("document_version_files")
          .delete()
          .eq("version_id", versionId)
          .in("id", deleteFileIds);
        if (delErr) throw new Error(delErr.message);
      }

      if (files.length > 0) {
        const remainingFiles = existingFiles.filter((f) => !deleteFileIds.includes(f.id));
        const maxSortOrder = remainingFiles.reduce((max, f) => Math.max(max, f.sort_order ?? 0), -1);
        const fileRows = files.map((f, i) => ({
          id: randomUUID(),
          version_id: versionId,
          file_type: f.fileType,
          file_path: f.filePath,
          original_name: f.originalName,
          sort_order: f.sortOrder ?? maxSortOrder + 1 + i,
          created_at: now,
        }));

        const { error: insErr } = await supabase.from("document_version_files").insert(fileRows);
        if (insErr) throw new Error(insErr.message);

        const { data: updatedFiles, error: refetchErr } = await supabase
          .from("document_version_files")
          .select("*")
          .eq("version_id", versionId)
          .order("sort_order", { ascending: true });

        if (refetchErr) throw new Error(refetchErr.message);
        fileRecords = (updatedFiles ?? []).map(mapVersionFileRow);
      } else {
        const { data: remainingRows, error: remErr } = await supabase
          .from("document_version_files")
          .select("*")
          .eq("version_id", versionId)
          .order("sort_order", { ascending: true });

        if (remErr) throw new Error(remErr.message);
        fileRecords = (remainingRows ?? []).map(mapVersionFileRow);
      }
    } else {
      const { data: existingFiles, error: listErr } = await supabase
        .from("document_version_files")
        .select("*")
        .eq("version_id", versionId)
        .order("sort_order", { ascending: true });

      if (listErr) throw new Error(listErr.message);
      fileRecords = (existingFiles ?? []).map(mapVersionFileRow);
    }

    const versionPatch: Record<string, unknown> = {};
    if (willUpdateChangelog) versionPatch.changelog = rawChangelog;

    let updatedVersion = versionRow;
    if (Object.keys(versionPatch).length > 0) {
      const { data: updated, error: updVerErr } = await supabase
        .from("document_versions")
        .update(versionPatch)
        .eq("id", versionId)
        .eq("document_id", documentId)
        .select("*")
        .single();

      if (updVerErr || !updated) throw new Error(updVerErr?.message ?? "Erro ao atualizar a versão.");
      updatedVersion = updated;
    }

    const isCurrent = versionRow.version_number === currentDoc.current_version;

    if (files.length > 0 && isCurrent) {
      const primaryFile = files.find((f) => f.fileType === "document") ?? files[0];
      const hasPdfForSearch =
        primaryFile?.fileType === "document" &&
        primaryFile.originalName.toLowerCase().endsWith(".pdf");

      const docPatch: Record<string, unknown> = {
        search_text: null,
        search_text_updated_at: null,
        preview_status: "skipped",
        search_status: hasPdfForSearch ? "pending" : "skipped",
        preview_error: null,
        search_error: null,
        updated_at: now,
      };

      let { error: docUpdErr } = await supabase.from("documents").update(docPatch).eq("id", documentId);

      if (docUpdErr && shouldIgnoreOptionalDocumentColumnError(docUpdErr.message)) {
        ({ error: docUpdErr } = await supabase.from("documents").update({ updated_at: now }).eq("id", documentId));
      }

      if (docUpdErr) throw new Error(docUpdErr.message);
    } else if (willUpdateChangelog || files.length > 0) {
      let { error: touchErr } = await supabase.from("documents").update({ updated_at: now }).eq("id", documentId);
      if (touchErr && shouldIgnoreOptionalDocumentColumnError(touchErr.message)) {
        touchErr = null;
      }
      if (touchErr) throw new Error(touchErr.message);
    }

    await supabase.from("audit_logs").insert({
      id: randomUUID(),
      event: `document.version.patched:${documentId}`,
      actor_id: actor.id,
      metadata: {
        documentId,
        versionId,
        versionNumber: versionRow.version_number,
        changelogOnly: files.length === 0,
        filesReplaced: files.length > 0,
      },
      created_at: now,
    });

    return {
      version: mapVersionRow(updatedVersion, fileRecords),
      obsoleteFilePaths,
    };
  }

  const doc = documentsStore.find((item) => item.id === documentId);
  if (!doc) throw new Error("Documento não encontrado.");
  const index = versionsStore.findIndex(
    (item) => item.id === versionId && item.documentId === documentId,
  );
  if (index === -1) throw new Error("Versão não encontrada.");

  const existing = versionsStore[index];
  let obsoleteFilePaths: string[] = [];

  if (files.length > 0) {
    obsoleteFilePaths = (existing.files ?? []).map((f) => f.filePath).filter(Boolean);
    existing.files = files.map((f, i) => ({
      id: randomUUID(),
      versionId,
      fileType: f.fileType,
      filePath: f.filePath,
      originalName: f.originalName,
      sortOrder: f.sortOrder ?? i,
      createdAt: now,
    }));
  }

  if (willUpdateChangelog) {
    existing.changelog = rawChangelog!;
  }

  doc.updatedAt = now;
  logAudit(`document.version.patched:${documentId}`, actor.id, {
    documentId,
    versionId,
    versionNumber: existing.versionNumber,
  });

  return {
    version: existing,
    obsoleteFilePaths,
  };
}

export async function deleteVersion(documentId: string, versionId: string, actor: AppUser) {
  if (!canUploadVersion(actor.role)) throw new Error("Não autorizado para eliminar versões.");

  const supabase = createSupabaseServerClient();
  const now = new Date().toISOString();

  if (supabase) {
    const { data: currentDoc, error: docErr } = await supabase
      .from("documents")
      .select("id,current_version")
      .eq("id", documentId)
      .maybeSingle();

    if (docErr) throw new Error(docErr.message);
    if (!currentDoc) throw new Error("Documento não encontrado.");

    const { data: versionRow, error: verErr } = await supabase
      .from("document_versions")
      .select("*")
      .eq("id", versionId)
      .eq("document_id", documentId)
      .maybeSingle();

    if (verErr) throw new Error(verErr.message);
    if (!versionRow) throw new Error("Versão não encontrada.");
    if (versionRow.version_number === currentDoc.current_version) {
      throw new Error("Não é possível eliminar a versão atual do documento.");
    }

    const { data: fileRows } = await supabase
      .from("document_version_files")
      .select("file_path")
      .eq("version_id", versionId);

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
      metadata: { documentId, versionId, versionNumber: versionRow.version_number },
      created_at: now,
    });

    return {
      version: mapVersionRow(versionRow),
      paths: (fileRows ?? []).map((r: any) => r.file_path).filter(Boolean),
    };
  }

  const doc = documentsStore.find((item) => item.id === documentId);
  if (!doc) throw new Error("Documento não encontrado.");
  const index = versionsStore.findIndex(
    (item) => item.id === versionId && item.documentId === documentId,
  );
  if (index === -1) throw new Error("Versão não encontrada.");
  if (versionsStore[index].versionNumber === doc.currentVersion) {
    throw new Error("Não é possível eliminar a versão atual do documento.");
  }
  const [deleted] = versionsStore.splice(index, 1);
  logAudit(`document.version.deleted:${documentId}`, actor.id, { documentId, versionId });
  return { version: deleted, paths: [] };
}
