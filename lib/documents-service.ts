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

const documentsStore = [...mockDocuments];
const versionsStore: DocumentVersionRecord[] = [];
const commentsStore: DocumentCommentRecord[] = [];
const auditStore: { id: string; event: string; at: string; actorId: string }[] = [];

function logAudit(event: string, actorId: string) {
  auditStore.push({ id: randomUUID(), event, actorId, at: new Date().toISOString() });
}

export function listCategories() {
  return mockCategories;
}

export function listDocuments() {
  return documentsStore;
}

export function getDocumentById(id: string) {
  return documentsStore.find((doc) => doc.id === id) ?? null;
}

export function createDocument(payload: unknown, actor: AppUser): DocumentRecord {
  if (!canEditDocument(actor.role)) {
    throw new Error("No autorizado para crear documentos.");
  }
  const parsed = documentCreateSchema.parse(payload);
  const now = new Date().toISOString();
  const doc: DocumentRecord = {
    id: randomUUID(),
    title: parsed.title,
    summary: parsed.summary,
    categoryId: parsed.categoryId,
    department: parsed.department,
    status: "draft",
    currentVersion: 1,
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

export function updateDocument(id: string, payload: unknown, actor: AppUser) {
  if (!canEditDocument(actor.role)) {
    throw new Error("No autorizado para editar.");
  }
  const parsed = documentUpdateSchema.parse(payload);
  const doc = getDocumentById(id);
  if (!doc) {
    throw new Error("Documento no encontrado.");
  }
  if (
    parsed.status &&
    !canTransitionStatus(actor.role, doc.status, parsed.status)
  ) {
    throw new Error("Transicion de estado no permitida.");
  }
  Object.assign(doc, parsed, { updatedAt: new Date().toISOString() });
  logAudit(`document.updated:${doc.id}`, actor.id);
  return doc;
}

export function addComment(documentId: string, payload: unknown, actor: AppUser) {
  const doc = getDocumentById(documentId);
  if (!doc) {
    throw new Error("Documento no encontrado.");
  }
  const parsed = commentSchema.parse(payload);
  const comment: DocumentCommentRecord = {
    id: randomUUID(),
    documentId,
    content: parsed.content,
    authorId: actor.id,
    createdAt: new Date().toISOString(),
  };
  commentsStore.push(comment);
  logAudit(`document.comment:${documentId}`, actor.id);
  return comment;
}

export function addVersion(documentId: string, payload: unknown, actor: AppUser) {
  if (!canUploadVersion(actor.role)) {
    throw new Error("No autorizado para subir versiones.");
  }
  const doc = getDocumentById(documentId);
  if (!doc) {
    throw new Error("Documento no encontrado.");
  }
  const parsed = versionSchema.parse(payload);
  const version: DocumentVersionRecord = {
    id: randomUUID(),
    documentId,
    versionNumber: doc.currentVersion + 1,
    changelog: parsed.changelog,
    filePath: parsed.filePath,
    createdBy: actor.id,
    createdAt: new Date().toISOString(),
  };
  versionsStore.unshift(version);
  doc.currentVersion = version.versionNumber;
  doc.mainFilePath = parsed.filePath;
  doc.updatedAt = new Date().toISOString();
  logAudit(`document.version:${documentId}`, actor.id);
  return version;
}

export function listDocumentHistory(documentId: string) {
  return {
    versions: versionsStore.filter((item) => item.documentId === documentId),
    comments: commentsStore.filter((item) => item.documentId === documentId),
    audits: auditStore.filter((item) => item.event.includes(documentId)),
  };
}
