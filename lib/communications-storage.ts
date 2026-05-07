import { createSupabaseServerClient } from "@/lib/supabase-server";

const BUCKET = "documents";
const PREFIX = "communications";

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 180) || "anexo";
}

export function buildCommunicationAttachmentPath(communicationId: string, fileName: string) {
  const safe = safeFileName(fileName);
  return `${PREFIX}/${communicationId}/${Date.now()}-${safe}`;
}

export async function uploadCommunicationAttachment(
  communicationId: string,
  file: File,
) {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase não configurado para upload de anexos.");
  }

  const path = buildCommunicationAttachmentPath(communicationId, file.name);
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: false,
    contentType: file.type || undefined,
  });

  if (error) {
    throw error;
  }

  return {
    storagePath: path,
    fileName: file.name,
    mimeType: file.type || null,
    sizeBytes: file.size ?? null,
  };
}

export async function signCommunicationAttachment(path: string, expiresIn = 3600) {
  const supabase = createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data?.signedUrl ?? null;
}

export async function deleteCommunicationAttachments(paths: string[]) {
  const supabase = createSupabaseServerClient();
  if (!supabase) return;
  const cleaned = Array.from(new Set(paths.filter(Boolean)));
  if (cleaned.length === 0) return;
  const { error } = await supabase.storage.from(BUCKET).remove(cleaned);
  if (error) throw error;
}
