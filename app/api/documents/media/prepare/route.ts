import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createDocument } from "@/lib/documents-service";
import { getDocumentFileType } from "@/lib/document-file";
import { getMainFileObjectPath } from "@/lib/storage-path";
import { documentCreateSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const user = await requireAuth();

  try {
    const body = await request.json();
    const filename =
      typeof body.filename === "string" ? body.filename.trim() : "";
    const fileType = getDocumentFileType(filename);

    if (!filename || !fileType || (fileType !== "video" && fileType !== "audio")) {
      return NextResponse.json(
        { error: "Esta rota apenas prepara uploads MP4/MP3." },
        { status: 400 },
      );
    }

    const payload = documentCreateSchema.parse({
      title: body.title,
      summary: body.summary,
      categoryId: body.categoryId,
      department: body.department,
      versionNumber: body.versionNumber,
      ownerId: user.id,
      tags: Array.isArray(body.tags) ? body.tags : [],
      internalNotes: body.internalNotes,
    });

    const initialVersionNumber =
      typeof body.versionNumber === "number" && body.versionNumber > 0
        ? body.versionNumber
        : 1;

    const document = await createDocument(payload, user, {
      initialVersionNumber,
    });
    const objectPath = getMainFileObjectPath(document.id, filename);

    return NextResponse.json({
      data: {
        documentId: document.id,
        objectPath,
        bucket: "documents",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro inesperado.",
      },
      { status: 400 },
    );
  }
}
