import type { AppUser, DocumentCategory } from "@/lib/types";

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

