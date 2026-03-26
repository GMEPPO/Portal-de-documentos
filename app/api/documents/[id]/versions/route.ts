import { NextResponse } from "next/server";
import { addVersion } from "@/lib/documents-service";
import { requireAuth } from "@/lib/auth";
import { versionSchema } from "@/lib/validations";
import { uploadDocumentAssets } from "@/lib/document-upload-service";
import { deleteDocumentFile } from "@/lib/storage-service";

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

      const uploaded = await uploadDocumentAssets(params.id, file);
      uploadedPaths = uploaded.uploadedPaths;

      const version = await addVersion(
        params.id,
        versionSchema.parse({
          changelog:
            typeof form.get("changelog") === "string"
              ? form.get("changelog")
              : "Nova versao do documento",
          filePath: uploaded.mainFilePath,
          previewFilePath: uploaded.previewFilePath,
        }),
        user,
      );

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
