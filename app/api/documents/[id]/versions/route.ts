import { NextResponse } from "next/server";
import {
  addVersion,
  getDocumentById,
  replaceCurrentVersion,
  updateDocument,
} from "@/lib/documents-service";
import { requireAuth } from "@/lib/auth";
import { documentStatusSchema, versionSchema } from "@/lib/validations";
import { deleteDocumentFiles } from "@/lib/storage-service";
import { getDocumentFileType } from "@/lib/document-file";
import { uploadVersionFiles } from "@/lib/document-upload-service";
import { randomUUID } from "crypto";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await requireAuth();
  let uploadedPaths: string[] = [];

  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();

      // Recolhe todos os ficheiros (campo "files[]" ou "mainFile" para retrocompatibilidade)
      const rawFiles = form.getAll("files[]");
      const legacyFile = form.get("mainFile");
      const files: File[] = [
        ...(legacyFile instanceof File ? [legacyFile] : []),
        ...rawFiles.filter((f): f is File => f instanceof File),
      ];

      const currentDoc = await getDocumentById(params.id);
      if (!currentDoc) {
        return NextResponse.json({ error: "Documento não encontrado." }, { status: 404 });
      }

      const statusAfterUpload =
        typeof form.get("statusAfterUpload") === "string"
          ? documentStatusSchema.parse(form.get("statusAfterUpload"))
          : null;

      const shouldReplaceCurrentVersion =
        statusAfterUpload === "published" && currentDoc.status === "in_review";

      if (files.length === 0 && !shouldReplaceCurrentVersion) {
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

      const versionId = randomUUID();
      const uploaded = files.length > 0
        ? await uploadVersionFiles(params.id, versionId, files)
        : [];
      uploadedPaths = uploaded.map((f) => f.filePath);

      const versionNumber = typeof form.get("versionNumber") === "string"
        ? Number(form.get("versionNumber"))
        : 1;

      const versionPayload = versionSchema.parse({
        changelog: typeof form.get("changelog") === "string"
          ? form.get("changelog")
          : `Versão V${String(versionNumber).padStart(3, "0")}`,
        versionNumber,
      });

      const version = shouldReplaceCurrentVersion
        ? await replaceCurrentVersion(params.id, versionPayload, user, uploaded)
        : await addVersion(params.id, versionPayload, user, uploaded);

      if (statusAfterUpload) {
        await updateDocument(
          params.id,
          {
            summary: typeof form.get("summary") === "string" ? form.get("summary") : undefined,
            department: typeof form.get("department") === "string" ? form.get("department") : undefined,
            internalNotes: typeof form.get("internalNotes") === "string" ? form.get("internalNotes") : undefined,
            status: statusAfterUpload,
          },
          user,
        );
      }

      return NextResponse.json({ data: version, processingQueued: true }, { status: 201 });
    }

    const body = await request.json();
    const version = await addVersion(params.id, body, user, []);
    return NextResponse.json({ data: version }, { status: 201 });
  } catch (error) {
    if (uploadedPaths.length > 0) {
      try { await deleteDocumentFiles(uploadedPaths); } catch { /* noop */ }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro inesperado." },
      { status: 400 },
    );
  }
}
