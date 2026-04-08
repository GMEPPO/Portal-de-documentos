import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { addVersion, deleteDocument, getDocumentById } from "@/lib/documents-service";
import { getDocumentFileType } from "@/lib/document-file";
import { createSupabaseServiceServerClient } from "@/lib/supabase-service-server";
import { deleteDocumentFile } from "@/lib/storage-service";
import { versionSchema } from "@/lib/validations";

function splitStoragePath(path: string) {
  const normalized = path.trim().replace(/^\/+/, "");
  const lastSlash = normalized.lastIndexOf("/");
  if (lastSlash === -1) {
    return { folder: "", name: normalized };
  }

  return {
    folder: normalized.slice(0, lastSlash),
    name: normalized.slice(lastSlash + 1),
  };
}

export async function POST(request: Request) {
  const user = await requireAuth();
  let uploadedPath: string | null = null;
  let documentId: string | null = null;

  try {
    const body = await request.json();
    documentId = typeof body.documentId === "string" ? body.documentId : null;
    uploadedPath = typeof body.objectPath === "string" ? body.objectPath : null;
    const filename =
      typeof body.filename === "string" ? body.filename.trim() : "";

    if (!documentId || !uploadedPath || !filename) {
      return NextResponse.json(
        { error: "Faltam dados para finalizar o upload multimedia." },
        { status: 400 },
      );
    }

    const fileType = getDocumentFileType(filename);
    if (!fileType || (fileType !== "video" && fileType !== "audio")) {
      return NextResponse.json(
        { error: "Apenas MP4/MP3 podem ser finalizados nesta rota." },
        { status: 400 },
      );
    }

    const currentDoc = await getDocumentById(documentId);
    if (!currentDoc) {
      return NextResponse.json({ error: "Documento no encontrado." }, { status: 404 });
    }

    const supabase = createSupabaseServiceServerClient();
    if (!supabase) {
      throw new Error("Supabase service role nao configurada.");
    }

    const { folder, name } = splitStoragePath(uploadedPath);
    const listResult = await supabase.storage.from("documents").list(folder, {
      search: name,
    });

    if (listResult.error) {
      throw new Error(listResult.error.message);
    }

    const exists = (listResult.data ?? []).some((item) => item.name === name);
    if (!exists) {
      return NextResponse.json(
        { error: "O ficheiro multimedia ainda nao esta disponivel no bucket." },
        { status: 400 },
      );
    }

    const versionPayload = versionSchema.parse({
      changelog:
        typeof body.changelog === "string"
          ? body.changelog
          : `Inicial (V${String(body.versionNumber ?? 1).padStart(3, "0")}) - upload do ficheiro principal`,
      filePath: uploadedPath,
      fileType,
      versionNumber:
        typeof body.versionNumber === "number"
          ? body.versionNumber
          : Number(body.versionNumber ?? 1),
    });

    const version = await addVersion(documentId, versionPayload, user);
    return NextResponse.json({ data: version }, { status: 201 });
  } catch (error) {
    if (uploadedPath) {
      try {
        await deleteDocumentFile(uploadedPath);
      } catch {
        // noop
      }
    }

    if (documentId) {
      try {
        await deleteDocument(documentId, user);
      } catch {
        // noop
      }
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro inesperado.",
      },
      { status: 400 },
    );
  }
}
