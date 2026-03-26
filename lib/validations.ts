import { z } from "zod";

export const documentStatusSchema = z.enum([
  "in_review",
  "published",
]);

export const documentCreateSchema = z.object({
  title: z.string().min(4).max(180),
  summary: z.string().min(8).max(1000),
  categoryId: z.string().optional().default(""),
  department: z.string().min(2).max(100),
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
  previewFilePath: z.string().min(1).optional(),
});

export type DocumentCreateInput = z.infer<typeof documentCreateSchema>;
export type DocumentUpdateInput = z.infer<typeof documentUpdateSchema>;
