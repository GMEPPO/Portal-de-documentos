import { createSupabaseServiceServerClient } from "@/lib/supabase-service-server";

const BUCKET = "documents";

export async function uploadDocumentFile(path: string, file: File) {
  const supabase = createSupabaseServiceServerClient();
  if (!supabase) {
    return { path, fallback: true };
  }
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: true,
  });
  if (error) {
    throw error;
  }
  return { path, fallback: false };
}
