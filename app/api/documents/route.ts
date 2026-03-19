import { NextResponse } from "next/server";
import { addVersion, createDocument, listDocuments } from "@/lib/documents-service";
import { requireAuth } from "@/lib/auth";
import { uploadDocumentFile } from "@/lib/storage-service";
import { versionSchema } from "@/lib/validations";

export async function GET() {
  await requireAuth();
  return NextResponse.json({ data: listDocuments() });
}

export async function POST(request: Request) {
  const user = await requireAuth();
  try {
    const contentType = request.headers.get("content-type") ?? "";

    // Nuevo flujo: multipart/form-data con metadata + fichero principal.
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const mainFile = form.get("mainFile");
      const file = mainFile instanceof File ? mainFile : null;

      const payload = {
        title: typeof form.get("title") === "string" ? form.get("title") : "",
        summary: typeof form.get("summary") === "string" ? form.get("summary") : "",
        categoryId:
          typeof form.get("categoryId") === "string"
            ? form.get("categoryId")
            : "",
        department:
          typeof form.get("department") === "string" ? form.get("department") : "",
        ownerId: typeof form.get("ownerId") === "string" ? form.get("ownerId") : "",
        internalNotes:
          typeof form.get("internalNotes") === "string"
            ? form.get("internalNotes")
            : undefined,
        tags: [],
      };

      const doc = createDocument(payload, user);

      if (file) {
        const objectPath = `${doc.id}/main/${file.name}`;
        const uploaded = await uploadDocumentFile(objectPath, file);

        // Primera versión = fichero principal
        const versionPayload = versionSchema.parse({
          changelog: "Inicial - upload do ficheiro principal",
          filePath: uploaded.path,
        });

        addVersion(doc.id, versionPayload, user);
      }

      return NextResponse.json({ data: doc }, { status: 201 });
    }

    // Fallback compatibilidad: JSON
    const body = await request.json();
    const doc = createDocument(body, user);
    return NextResponse.json({ data: doc }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro inesperado." },
      { status: 400 },
    );
  }
}
