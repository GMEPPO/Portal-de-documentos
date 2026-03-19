export type UserRole = "viewer" | "editor" | "manager" | "admin";

export type DocumentStatus =
  | "draft"
  | "in_review"
  | "approved"
  | "published"
  | "archived"
  | "rejected";

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
  currentVersion: number;
  authorId: string;
  ownerId: string;
  mainFilePath?: string;
  tags: string[];
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentVersionRecord {
  id: string;
  documentId: string;
  versionNumber: number;
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
