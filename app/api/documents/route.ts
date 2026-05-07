import { NextResponse } from "next/server";
import { addVersion, createDocument, listDocuments } from "@/lib/documents-service";
import { requireAuth } from "@/lib/auth";
import { canAccessDocumentStatus } from "@/lib/rbac";
import { deleteDocumentFiles } from "@/lib/storage-service";
import { versionSchema } from "@/lib/validations";
import { parseDepartmentTitleVersion } from "@/lib/document-name-parser";
import { createSupabaseServiceServerClient } from "@/lib/supabase-service-server";
import { getDocumentFileType } from "@/lib/document-file";
import { uploadVersionFiles } from "@/lib/document-upload-service";
import { randomUUID } from "crypto";

export async function GET() {
  const user = await requireAuth();
  const documents = (await listDocuments()).filter((doc) =>
    canAccessDocumentStatus(user.role, doc.status),
  );
  return NextResponse.json({ data: documents });
}

export async function POST(request: Request) {
  const user = await requireAuth();
  let createdDocumentId: string | null = null;
  let uploadedPaths: string[] = [];

  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();

      // Recolhe todos os ficheiros enviados (campo "files[]" ou "mainFile" para retrocompatibilidade)
      const rawFiles = form.getAll("files[]");
      const legacyFile = form.get("mainFile");
      const files: File[] = [
        ...(legacyFile instanceof File ? [legacyFile] : []),
        ...rawFiles.filter((f): f is File => f instanceof File),
      ];

      if (files.length === 0) {
        return NextResponse.json({ error: "Deves adjuntar pelo menos um ficheiro." }, { status: 400 });
      }

      for (const file of files) {
        if (!getDocumentFileType(file.name)) {
          return NextResponse.json(
            { error: `Formato não suportado: ${file.name}. Usa PDF, Word, MP4, MP3 ou M4A.` },
            { status: 400 },
          );
        }
      }

      const firstFile = files[0];
      const parseSource = String(firstFile?.name ?? form.get("title") ?? "");
      const parsedName = parseDepartmentTitleVersion(parseSource);

      const payload = {
        title: (typeof form.get("title") === "string" && form.get("title") !== ""
          ? form.get("title")
          : parsedName.title) || "Sem título",
        summary: typeof form.get("summary") === "string" ? form.get("summary") : "",
        categoryId: typeof form.get("categoryId") === "string" ? form.get("categoryId") : "",
        department: parsedName.department || (typeof form.get("department") === "string" ? form.get("department") : ""),
        ownerId: user.id,
        versionNumber: typeof form.get("versionNumber") === "string"
          ? Number(form.get("versionNumber"))
          : parsedName.versionNumber || 1,
        internalNotes: typeof form.get("internalNotes") === "string" ? form.get("internalNotes") : undefined,
        tags: form.getAll("tags[]").filter((t): t is string => typeof t === "string" && t.trim() !== "").map((t) => t.trim()),
      };

      const initialVersionNumber = payload.versionNumber || 1;

      const doc = await createDocument(payload, user, { initialVersionNumber });
      createdDocumentId = doc.id;

      const versionId = randomUUID();
      const uploaded = await uploadVersionFiles(doc.id, versionId, files);
      uploadedPaths = uploaded.map((f) => f.filePath);

      const versionPayload = versionSchema.parse({
        changelog: `Versão inicial (V${String(initialVersionNumber).padStart(3, "0")})`,
        versionNumber: initialVersionNumber,
      });

      await addVersion(doc.id, versionPayload, user, uploaded);

      return NextResponse.json({ data: doc, processingQueued: true }, { status: 201 });
    }

    const body = await request.json();
    const doc = await createDocument(body, user);
    return NextResponse.json({ data: doc }, { status: 201 });
  } catch (error) {
    if (createdDocumentId) {
      const supabase = createSupabaseServiceServerClient();
      if (supabase) {
        await supabase.from("documents").delete().eq("id", createdDocumentId);
      }
    }
    if (uploadedPaths.length > 0) {
      try { await deleteDocumentFiles(uploadedPaths); } catch { /* noop */ }
    }

    const message =
      error instanceof Error ? error.message : "Erro inesperado.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
