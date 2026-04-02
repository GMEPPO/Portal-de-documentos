export type UserRole = "viewer" | "editor" | "manager" | "admin";

export type DocumentStatus =
  | "in_review"
  | "updating"
  | "published";

export type DocumentFileType = "document" | "video" | "audio";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
}

export interface DocumentRecord {
  id: string;
  title: string;
  summary: string;
  categoryId: string;
  department: string;
  status: DocumentStatus;
  documentType: DocumentFileType;
  currentVersion: number;
  authorId: string;
  ownerId: string;
  mainFilePath?: string;
  previewFilePath?: string;
  searchText?: string;
  tags: string[];
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentVersionRecord {
  id: string;
  documentId: string;
  versionNumber: number;
  fileType: DocumentFileType;
  filePath: string;
  changelog: string;
  createdBy: string;
  createdAt: string;
}

export interface DocumentCommentRecord {
  id: string;
  documentId: string;
  content: string;
  authorId: string;
  createdAt: string;
}

export interface DocumentCategory {
  id: string;
  name: string;
}

export interface DocumentAuditRecord {
  id: string;
  event: string;
  actorId: string;
  at: string;
  metadata?: Record<string, unknown> | null;
}
