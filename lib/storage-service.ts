import { createSupabaseServerClient } from "@/lib/supabase-server";

const BUCKET = "documents";

export async function uploadDocumentFile(path: string, file: File) {
  // Usamos el cliente autenticado (anon + cookies/sesion) para que RLS
  // aplique correctamente policies del bucket/objects.
  const supabase = createSupabaseServerClient();
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

export async function deleteDocumentFile(path: string) {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return;
  }
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) {
    throw error;
  }
}

export async function deleteDocumentFiles(paths: string[]) {
  const uniquePaths = Array.from(new Set(paths.filter(Boolean)));
  if (uniquePaths.length === 0) {
    return;
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return;
  }

  const { error } = await supabase.storage.from(BUCKET).remove(uniquePaths);
  if (error) {
    throw error;
  }
}

export async function getDocumentFileSignedUrl(path: string, expiresIn = 3600) {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw error;
  }

  return data?.signedUrl ?? null;
}

export async function downloadDocumentFile(path: string) {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
