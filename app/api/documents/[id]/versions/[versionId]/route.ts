import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { deleteVersion } from "@/lib/documents-service";
import { deleteDocumentFile } from "@/lib/storage-service";

export async function DELETE(
  _: Request,
  { params }: { params: { id: string; versionId: string } },
) {
  const user = await requireAuth();
  try {
    const deleted = await deleteVersion(params.id, params.versionId, user);
    await deleteDocumentFile(deleted.filePath);
    return NextResponse.json({ data: deleted });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro inesperado." },
      { status: 400 },
    );
  }
}
