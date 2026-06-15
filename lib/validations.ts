import { z } from "zod";

export const userRoleSchema = z.enum([
  "viewer",
  "editor",
  "manager",
  "admin",
]);

export const documentStatusSchema = z.enum([
  "in_review",
  "updating",
  "published",
]);

export const documentFileTypeSchema = z.enum([
  "document",
  "video",
  "audio",
]);

export const documentCreateSchema = z.object({
  title: z.string().min(4).max(180),
  summary: z.string().min(8).max(1000),
  categoryId: z.string().optional().default(""),
  department: z.string().min(2).max(100),
  documentType: documentFileTypeSchema.optional(),
  versionNumber: z.coerce.number().int().positive(),
  ownerId: z.string().optional(),
  tags: z.array(z.string().min(1)).default([]),
  internalNotes: z.string().max(2000).optional(),
});

export const documentUpdateSchema = documentCreateSchema.partial().extend({
  status: documentStatusSchema.optional(),
});

export const commentSchema = z.object({
  content: z.string().min(2).max(1000),
});

export const versionSchema = z.object({
  changelog: z.string().min(3).max(1000),
  filePath: z.string().min(1),
  versionNumber: z.coerce.number().int().positive(),
  fileType: documentFileTypeSchema,
  previewFilePath: z.string().min(1).optional(),
});

export const adminUserCreateSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  department: z.string().min(2).max(100),
  role: userRoleSchema,
});

export const adminUserUpdateSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(2).max(120),
  department: z.string().min(2).max(100),
  role: userRoleSchema,
});

export const tagInputSchema = z.object({
  name: z.string().min(2).max(80),
  department: z.string().optional(),
});

export const tagUpdateSchema = tagInputSchema.extend({
  id: z.string().uuid(),
});

const communicationAttachmentSchema = z.object({
  storagePath: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().nullable().optional(),
  sizeBytes: z.number().int().nonnegative().nullable().optional(),
});

export const communicationDraftSchema = z.object({
  documentId: z.string().uuid(),
  subject: z.string().min(3).max(200),
  message: z.string().min(3).max(5000),
  attachments: z.array(communicationAttachmentSchema).default([]),
});

export const eventKindSchema = z.enum([
  "meeting",
  "training",
  "presentation",
  "other",
]);

export const eventInputSchema = z.object({
  subject: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  kind: eventKindSchema,
  startsAt: z.string().min(1),
  endsAt: z.string().optional(),
  location: z.string().max(200).optional(),
  isOnline: z.boolean(),
  onlineUrl: z.string().max(500).optional(),
  documentIds: z.array(z.string().uuid()).default([]),
  minutesDocumentIds: z.array(z.string().uuid()).default([]),
  attendeeIds: z.array(z.string().uuid()).default([]),
});

export type DocumentCreateInput = z.infer<typeof documentCreateSchema>;
export type DocumentUpdateInput = z.infer<typeof documentUpdateSchema>;
export type CommunicationDraft = z.infer<typeof communicationDraftSchema>;
export type EventInput = z.infer<typeof eventInputSchema>;
