import { NextResponse } from "next/server";
import { addVersion, updateDocument } from "@/lib/documents-service";
import { requireAuth } from "@/lib/auth";
import { documentStatusSchema, versionSchema } from "@/lib/validations";
import { deleteDocumentFile, uploadDocumentFile } from "@/lib/storage-service";
import { getMainFileObjectPath } from "@/lib/storage-path";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await requireAuth();
  let uploadedPaths: string[] = [];
  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const mainFile = form.get("mainFile");
      const file = mainFile instanceof File ? mainFile : null;
      if (!file) {
        return NextResponse.json({ error: "Ficheiro obrigatorio." }, { status: 400 });
      }

      const objectPath = getMainFileObjectPath(params.id, file.name);
      const uploaded = await uploadDocumentFile(objectPath, file);
      uploadedPaths = [uploaded.path];

      const statusAfterUpload =
        typeof form.get("statusAfterUpload") === "string"
          ? documentStatusSchema.parse(form.get("statusAfterUpload"))
          : null;

      if (statusAfterUpload === "published" && !file.name.toLowerCase().endsWith(".pdf")) {
        throw new Error("Para publicar, debes adjuntar un PDF.");
      }

      const version = await addVersion(
        params.id,
        versionSchema.parse({
          changelog:
            typeof form.get("changelog") === "string"
              ? form.get("changelog")
              : "Nova versao do documento",
          filePath: uploaded.path,
          versionNumber:
            typeof form.get("versionNumber") === "string"
              ? Number(form.get("versionNumber"))
              : 1,
        }),
        user,
      );

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

      return NextResponse.json({ data: version }, { status: 201 });
    }

    const body = await request.json();
    const version = await addVersion(params.id, body, user);
    return NextResponse.json({ data: version }, { status: 201 });
  } catch (error) {
    for (const uploadedPath of uploadedPaths.reverse()) {
      try {
        await deleteDocumentFile(uploadedPath);
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
