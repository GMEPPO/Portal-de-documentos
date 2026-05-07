import { z } from "zod";
import { createSupabaseServiceServerClient } from "@/lib/supabase-service-server";
import { tagInputSchema, tagUpdateSchema } from "@/lib/validations";
import { departmentOptions } from "@/lib/constants";
import type { AppUser } from "@/lib/types";

function getServiceClient() {
  const supabase = createSupabaseServiceServerClient();
  if (!supabase) {
    throw new Error("Supabase service role não configurada.");
  }
  return supabase;
}

export type DocumentTag = {
  id: string;
  name: string;
  department: string | null;
  createdAt: string;
};

function mapTag(row: any): DocumentTag {
  return {
    id: row.id,
    name: row.name,
    department: row.department ?? null,
    createdAt: row.created_at ?? row.createdAt,
  };
}

function assertDepartment(value?: string) {
  if (!value) return null;
  const allowed = departmentOptions as readonly string[];
  if (!allowed.includes(value)) {
    throw new Error(`Departamento inválido: ${value}.`);
  }
  return value;
}

export async function listDocumentTags(): Promise<DocumentTag[]> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("document_tags")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapTag);
}

export async function createDocumentTag(actor: AppUser, formData: FormData) {
  if (actor.role !== "admin") throw new Error("Não autorizado.");
  const parsed = tagInputSchema.parse({
    name: formData.get("name"),
    department: formData.get("department") || undefined,
  });
  const department = assertDepartment(parsed.department);
  const supabase = getServiceClient();

  const { error } = await supabase
    .from("document_tags")
    .insert({ name: parsed.name, department });
  if (error) throw new Error(error.message);
}

export async function updateDocumentTag(actor: AppUser, formData: FormData) {
  if (actor.role !== "admin") throw new Error("Não autorizado.");
  const parsed = tagUpdateSchema.parse({
    id: formData.get("id"),
    name: formData.get("name"),
    department: formData.get("department") || undefined,
  });
  const department = assertDepartment(parsed.department);
  const supabase = getServiceClient();

  const { error } = await supabase
    .from("document_tags")
    .update({ name: parsed.name, department })
    .eq("id", parsed.id);
  if (error) throw new Error(error.message);
}

export async function deleteDocumentTag(actor: AppUser, formData: FormData) {
  if (actor.role !== "admin") throw new Error("Não autorizado.");
  const id = z.string().uuid().parse(formData.get("id"));
  const supabase = getServiceClient();

  const { error } = await supabase.from("document_tags").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
