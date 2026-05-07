export type UserRole = "viewer" | "editor" | "manager" | "admin";
export type Locale = "pt-PT" | "es";

export type DocumentStatus =
  | "in_review"
  | "updating"
  | "published";

export type DocumentFileType = "document" | "video" | "audio";
export type DocumentProcessingStatus =
  | "pending"
  | "processing"
  | "ready"
  | "failed"
  | "skipped";

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
  ownerName?: string;
  previewFilePath?: string;
  searchText?: string;
  previewStatus: DocumentProcessingStatus;
  searchStatus: DocumentProcessingStatus;
  previewError?: string;
  searchError?: string;
  tags: string[];
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentVersionFileRecord {
  id: string;
  versionId: string;
  fileType: DocumentFileType;
  filePath: string;
  originalName: string;
  sortOrder: number;
  createdAt: string;
}

export interface DocumentVersionRecord {
  id: string;
  documentId: string;
  versionNumber: number;
  changelog: string;
  createdBy: string;
  createdAt: string;
  files?: DocumentVersionFileRecord[];
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

export type CommunicationStatus = "pending" | "sent" | "failed";

export interface CommunicationRecord {
  id: string;
  documentId: string;
  subject: string;
  message: string;
  sentBy: string;
  sentAt: string;
  n8nStatus: CommunicationStatus;
  n8nError?: string | null;
  recipientCount: number;
  tagsSnapshot: string[];
  departmentsSnapshot: string[];
}

export interface CommunicationRecipientRecord {
  id: string;
  communicationId: string;
  userId?: string | null;
  email: string;
  name?: string | null;
  department?: string | null;
}

export interface CommunicationAttachmentRecord {
  id: string;
  communicationId: string;
  storagePath: string;
  fileName: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
  createdAt: string;
}

export type EventKind = "meeting" | "training" | "presentation" | "other";
export type EventDocumentRole = "related" | "minutes";

export interface EventRecord {
  id: string;
  subject: string;
  description?: string | null;
  kind: EventKind;
  startsAt: string;
  endsAt?: string | null;
  location?: string | null;
  isOnline: boolean;
  onlineUrl?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventDocumentLink {
  eventId: string;
  documentId: string;
  role: EventDocumentRole;
}

export interface EventAttendeeRecord {
  eventId: string;
  userId: string;
  createdAt: string;
}
