import type { AppUser, DocumentCategory } from "@/lib/types";

export const departmentOptions = [
  "DSI",
  "APOIO A CLIENTES",
  "COMPRAS",
  "COMERCIAL",
  "EPPO",
  "FINANCEIRO",
  "COMUNICAÇÃO",
] as const;

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
  { id: "11111111-1111-1111-1111-111111111111", name: "Acordo Comercial" },
  { id: "22222222-2222-2222-2222-222222222222", name: "Apresentacao Institucional" },
  { id: "33333333-3333-3333-3333-333333333333", name: "Ata de Reuniao" },
  { id: "44444444-4444-4444-4444-444444444444", name: "Comunicado Interno" },
  { id: "55555555-5555-5555-5555-555555555555", name: "Financeiro" },
  { id: "66666666-6666-6666-6666-666666666666", name: "Formulario de Pedido" },
  { id: "77777777-7777-7777-7777-777777777777", name: "Instrucao de Trabalho" },
  { id: "88888888-8888-8888-8888-888888888888", name: "Nomenclatura" },
  { id: "99999999-9999-9999-9999-999999999999", name: "Procedimento Especifico" },
  { id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", name: "Procedimento Geral" },
  { id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", name: "Processo" },
  { id: "cccccccc-cccc-cccc-cccc-cccccccccccc", name: "RH" },
];

export function getCategoryNameById(categoryId: string) {
  return mockCategories.find((item) => item.id === categoryId)?.name ?? categoryId;
}

