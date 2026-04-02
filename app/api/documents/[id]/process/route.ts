import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { processDocumentAssets } from "@/lib/document-process-service";
import { getDocumentById } from "@/lib/documents-service";
import { canEditDocument } from "@/lib/rbac";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const user = await requireAuth();
  if (!canEditDocument(user.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const document = await getDocumentById(params.id);
  if (!document) {
    return NextResponse.json({ error: "Documento no encontrado." }, { status: 404 });
  }

  try {
    const processed = await processDocumentAssets(params.id);
    return NextResponse.json({ data: processed });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro inesperado." },
      { status: 400 },
    );
  }
}
