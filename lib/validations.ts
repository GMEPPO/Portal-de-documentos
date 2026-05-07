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
  versionNumber: z.coerce.number().int().positive(),
});

/** Corpo JSON para PATCH admin: apenas changelog. */
export const versionAdminPatchSchema = z.object({
  changelog: z.string().min(3).max(1000),
});

export const versionFileSchema = z.object({
  filePath: z.string().min(1),
  fileType: documentFileTypeSchema,
  originalName: z.string().min(1),
  sortOrder: z.number().int().nonnegative().default(0),
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
  name: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[\p{L}\p{N}\s._-]+$/u, "Formato inválido. Usa letras, números, espaços e ._-"),
  department: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export const tagUpdateSchema = tagInputSchema.extend({
  id: z.string().uuid(),
});

export const communicationDraftSchema = z.object({
  documentId: z.string().uuid(),
  subject: z.string().trim().min(3).max(200),
  message: z.string().trim().min(1).max(20000),
  attachments: z
    .array(
      z.object({
        storagePath: z.string().min(1),
        fileName: z.string().min(1).max(255),
        mimeType: z.string().max(120).optional(),
        sizeBytes: z.number().int().nonnegative().optional(),
      }),
    )
    .max(10)
    .default([]),
});

export const eventKindSchema = z.enum([
  "meeting",
  "training",
  "presentation",
  "other",
]);

export const eventInputSchema = z
  .object({
    subject: z.string().trim().min(3).max(200),
    description: z.string().trim().max(4000).optional(),
    kind: eventKindSchema.default("meeting"),
    startsAt: z.string().min(1),
    endsAt: z.string().optional(),
    location: z.string().trim().max(200).optional().or(z.literal("").transform(() => undefined)),
    isOnline: z.coerce.boolean().default(false),
    onlineUrl: z
      .string()
      .trim()
      .url("URL inválido.")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    documentIds: z.array(z.string().uuid()).default([]),
    minutesDocumentIds: z.array(z.string().uuid()).default([]),
    attendeeIds: z.array(z.string().uuid()).default([]),
  })
  .superRefine((data, ctx) => {
    if (!data.isOnline && !data.location) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["location"],
        message: "Indica a localização ou marca como online.",
      });
    }
    if (data.isOnline && !data.onlineUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["onlineUrl"],
        message: "URL online é obrigatório quando o evento é online.",
      });
    }
    if (data.endsAt) {
      const start = new Date(data.startsAt).getTime();
      const end = new Date(data.endsAt).getTime();
      if (Number.isFinite(start) && Number.isFinite(end) && end < start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endsAt"],
          message: "Fim deve ser posterior ao início.",
        });
      }
    }
  });

export type DocumentCreateInput = z.infer<typeof documentCreateSchema>;
export type DocumentUpdateInput = z.infer<typeof documentUpdateSchema>;
export type VersionInput = z.infer<typeof versionSchema>;
export type VersionFileInput = z.infer<typeof versionFileSchema>;
export type TagInput = z.infer<typeof tagInputSchema>;
export type CommunicationDraft = z.infer<typeof communicationDraftSchema>;
export type EventInput = z.infer<typeof eventInputSchema>;
