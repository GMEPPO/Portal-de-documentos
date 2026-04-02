import { NextResponse } from "next/server";
import {
  addVersion,
  getDocumentById,
  replaceCurrentVersion,
  updateDocument,
  updateDocumentSearchIndex,
} from "@/lib/documents-service";
import { requireAuth } from "@/lib/auth";
import { documentStatusSchema, versionSchema } from "@/lib/validations";
import { deleteDocumentFiles } from "@/lib/storage-service";
import { getDocumentFileType } from "@/lib/document-file";
import { uploadDocumentAssets } from "@/lib/document-upload-service";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await requireAuth();
  let uploadedPaths: string[] = [];

  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const mainFile = form.get("mainFile");
      const file = mainFile instanceof File ? mainFile : null;
      const fileType = file ? getDocumentFileType(file.name) : null;

      if (!file) {
        return NextResponse.json({ error: "Ficheiro obrigatorio." }, { status: 400 });
      }
      if (!fileType) {
        return NextResponse.json(
          { error: "Formato nao suportado. Usa PDF, Word, MP4 ou MP3." },
          { status: 400 },
        );
      }

      const uploaded = await uploadDocumentAssets(params.id, file);
      uploadedPaths = uploaded.uploadedPaths;
      const warnings: string[] = [uploaded.previewError, uploaded.searchIndexWarning].filter(
        (value): value is string => Boolean(value),
      );

      const statusAfterUpload =
        typeof form.get("statusAfterUpload") === "string"
          ? documentStatusSchema.parse(form.get("statusAfterUpload"))
          : null;

      const versionPayload = versionSchema.parse({
        changelog:
          typeof form.get("changelog") === "string"
            ? form.get("changelog")
            : "Nova versao do documento",
        filePath: uploaded.mainFilePath,
        fileType,
        previewFilePath: uploaded.previewFilePath,
        versionNumber:
          typeof form.get("versionNumber") === "string"
            ? Number(form.get("versionNumber"))
            : 1,
      });

      const currentDoc = await getDocumentById(params.id);
      if (!currentDoc) {
        return NextResponse.json({ error: "Documento no encontrado." }, { status: 404 });
      }

      const shouldReplaceCurrentVersion =
        statusAfterUpload === "published" && currentDoc.status === "in_review";

      const version = shouldReplaceCurrentVersion
        ? await replaceCurrentVersion(params.id, versionPayload, user)
        : await addVersion(params.id, versionPayload, user);

      if (statusAfterUpload) {
        await updateDocument(
          params.id,
          {
            summary:
              typeof form.get("summary") === "string" ? form.get("summary") : undefined,
            department:
              typeof form.get("department") === "string"
                ? form.get("department")
                : undefined,
            internalNotes:
              typeof form.get("internalNotes") === "string"
                ? form.get("internalNotes")
                : undefined,
            status: statusAfterUpload,
          },
          user,
        );
      }

      try {
        await updateDocumentSearchIndex(params.id, uploaded.searchText);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Falha ao guardar indice pesquisavel.";
        warnings.push(message);
      }

      return NextResponse.json(
        { data: version, warning: warnings.length > 0 ? warnings.join(" ") : undefined },
        { status: 201 },
      );
    }

    const body = await request.json();
    const version = await addVersion(params.id, body, user);
    return NextResponse.json({ data: version }, { status: 201 });
  } catch (error) {
    if (uploadedPaths.length > 0) {
      try {
        await deleteDocumentFiles(uploadedPaths);
      } catch {
        // noop
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro inesperado." },
      { status: 400 },
    );
  }
}
