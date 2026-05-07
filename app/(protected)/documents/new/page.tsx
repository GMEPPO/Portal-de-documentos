import { mockCategories } from "@/lib/constants";
import { requireAuth } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { NewDocumentClient } from "./new-document-client";

async function loadAvailableTags() {
  const supabase = createSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("document_tags").select("name").order("name", { ascending: true });
  if (error) return [];
  return (data ?? []).map((r: any) => r.name).filter(Boolean);
}

export default async function NewDocumentPage() {
  await requireAuth();
  const locale = getLocale();
  const availableTags = await loadAvailableTags();

  return <NewDocumentClient locale={locale} categories={mockCategories} availableTags={availableTags} />;
}
