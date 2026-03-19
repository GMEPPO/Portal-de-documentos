import type { AppUser, DocumentCategory, DocumentRecord } from "@/lib/types";

export const mockUsers: AppUser[] = [
  {
    id: "u-admin",
    name: "Admin Interno",
    email: "admin@empresa.local",
    role: "admin",
    department: "Operaciones",
  },
  {
    id: "u-manager",
    name: "Manager Calidad",
    email: "manager@empresa.local",
    role: "manager",
    department: "Calidad",
  },
];

export const mockCategories: DocumentCategory[] = [
  { id: "cat-policy", name: "Politica" },
  { id: "cat-procedure", name: "Procedimiento" },
  { id: "cat-form", name: "Formulario" },
];

export const mockDocuments: DocumentRecord[] = [
  {
    id: "doc-001",
    title: "Norma interna de revision documental",
    summary: "Define criterios de revision, periodicidad y responsabilidades.",
    categoryId: "cat-policy",
    department: "Calidad",
    status: "in_review",
    currentVersion: 2,
    authorId: "u-manager",
    ownerId: "u-manager",
    tags: ["calidad", "revision"],
    internalNotes: "Pendiente feedback legal.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
