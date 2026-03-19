import { NextResponse } from "next/server";
import { addVersion, createDocument, listDocuments } from "@/lib/documents-service";
import { requireAuth } from "@/lib/auth";
import { uploadDocumentFile } from "@/lib/storage-service";
import { versionSchema } from "@/lib/validations";
import { getMainFileObjectPath } from "@/lib/storage-path";
import { parseDepartmentTitleVersion } from "@/lib/document-name-parser";

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
        // Para evitar FK inválidos y simplificar el flujo,
        // el responsable inicial del documento es el usuario autenticado.
        ownerId: user.id,
        internalNotes:
          typeof form.get("internalNotes") === "string"
            ? form.get("internalNotes")
            : undefined,
        tags: [],
      };

      // Parse opcional desde el "nombre" del documento (title) o desde el fichero.
      // Caso típico: "PE.DSI - Manutenção de Preços - V001"
      const parseSource = file?.name ?? payload.title;
      const parsedName = parseDepartmentTitleVersion(parseSource);
      const initialVersionNumber = parsedName.versionNumber;

      // Si el parse encontró departamento/título, los aplicamos sobre el payload.
      if (parsedName.department) {
        payload.department = parsedName.department;
      }
      if (parsedName.title) {
        payload.title = parsedName.title;
      }

      const doc = await createDocument(payload, user, {
        initialVersionNumber,
      });

      if (file) {
        const objectPath = getMainFileObjectPath(doc.id, file.name);
        const uploaded = await uploadDocumentFile(objectPath, file);

        // Primera versión = fichero principal
        const versionPayload = versionSchema.parse({
          changelog: `Inicial (${initialVersionNumber ? `V${String(initialVersionNumber).padStart(3, "0")}` : "V?"}) - upload do ficheiro principal`,
          filePath: uploaded.path,
        });

        // Si el nombre trae V###, creamos el documento con la versión inicial correspondiente.
        // Para hacerlo, re-creamos la doc con current_version correcto no es ideal,
        // pero en esta implementación lo cubrimos ajustando el version_number al añadir la primera versión.
        // Como addVersion calcula "current_version + 1", al haber creado el doc en createDocument con
        // current_version = initialVersionNumber - 1, el addVersion deja version_number = initialVersionNumber.
        await addVersion(doc.id, versionPayload, user);
      }

      return NextResponse.json({ data: doc }, { status: 201 });
    }

    // Fallback compatibilidad: JSON
    const body = await request.json();
    const doc = await createDocument(body, user);
    return NextResponse.json({ data: doc }, { status: 201 });
  } catch (error) {
    const message =
      error && typeof error === "object" && "message" in error
        ? String((error as any).message)
        : error instanceof Error
          ? error.message
          : "Erro inesperado.";
    return NextResponse.json(
      { error: message },
      { status: 400 },
    );
  }
}
