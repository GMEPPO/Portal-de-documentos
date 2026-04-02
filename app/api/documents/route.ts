import { NextResponse } from "next/server";
import { addVersion, createDocument, listDocuments } from "@/lib/documents-service";
import { requireAuth } from "@/lib/auth";
import { canAccessDocumentStatus } from "@/lib/rbac";
import { deleteDocumentFiles } from "@/lib/storage-service";
import { versionSchema } from "@/lib/validations";
import { parseDepartmentTitleVersion } from "@/lib/document-name-parser";
import { createSupabaseServiceServerClient } from "@/lib/supabase-service-server";
import { getDocumentFileType } from "@/lib/document-file";
import { uploadDocumentAssets } from "@/lib/document-upload-service";

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
      const mainFile = form.get("mainFile");
      const file = mainFile instanceof File ? mainFile : null;
      const fileType = file ? getDocumentFileType(file.name) : null;

      const payload = {
        title: typeof form.get("title") === "string" ? form.get("title") : "",
        summary: typeof form.get("summary") === "string" ? form.get("summary") : "",
        categoryId:
          typeof form.get("categoryId") === "string" ? form.get("categoryId") : "",
        department:
          typeof form.get("department") === "string" ? form.get("department") : "",
        ownerId: user.id,
        versionNumber:
          typeof form.get("versionNumber") === "string"
            ? Number(form.get("versionNumber"))
            : 1,
        internalNotes:
          typeof form.get("internalNotes") === "string"
            ? form.get("internalNotes")
            : undefined,
        tags: [],
      };

      const parseSource = String(file?.name ?? payload.title ?? "");
      const parsedName = parseDepartmentTitleVersion(parseSource);
      const initialVersionNumber = payload.versionNumber || parsedName.versionNumber || 1;

      if (parsedName.department) {
        payload.department = parsedName.department;
      }
      if (parsedName.title) {
        payload.title = parsedName.title;
      }

      const doc = await createDocument(payload, user, {
        initialVersionNumber,
      });
      createdDocumentId = doc.id;

      if (!file) {
        throw new Error("Debes adjuntar un ficheiro para criar o documento.");
      }
      if (!fileType) {
        throw new Error("Formato nao suportado. Usa PDF, Word, MP4 ou MP3.");
      }

      const uploaded = await uploadDocumentAssets(doc.id, file);
      uploadedPaths = uploaded.uploadedPaths;

      const versionPayload = versionSchema.parse({
        changelog: `Inicial (${initialVersionNumber ? `V${String(initialVersionNumber).padStart(3, "0")}` : "V?"}) - upload do ficheiro principal`,
        filePath: uploaded.mainFilePath,
        fileType,
        previewFilePath: uploaded.previewFilePath,
        versionNumber: initialVersionNumber,
      });

      await addVersion(doc.id, versionPayload, user);

      return NextResponse.json({ data: doc }, { status: 201 });
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
      try {
        await deleteDocumentFiles(uploadedPaths);
      } catch {
        // noop
      }
    }

    const message =
      error && typeof error === "object" && "message" in error
        ? String((error as any).message)
        : error instanceof Error
          ? error.message
          : "Erro inesperado.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
