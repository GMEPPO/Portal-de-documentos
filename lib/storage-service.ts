import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseServiceServerClient } from "@/lib/supabase-service-server";

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
  if (!path) return null;

  // Try session client first; fall back to service role if it fails.
  // Service role bypasses any transient session issues and always has
  // access to bucket objects.
  const clients = [
    createSupabaseServerClient(),
    createSupabaseServiceServerClient(),
  ].filter(Boolean);

  for (const supabase of clients) {
    const { data, error } = await supabase!.storage
      .from(BUCKET)
      .createSignedUrl(path, expiresIn);

    if (!error && data?.signedUrl) {
      return data.signedUrl;
    }

    if (error) {
      console.error("[storage] createSignedUrl error", { path, message: error.message });
    }
  }

  return null;
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
