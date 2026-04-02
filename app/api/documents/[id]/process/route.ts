import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { processDocumentAssets } from "@/lib/document-process-service";
import { getDocumentById } from "@/lib/documents-service";
import { canEditDocument } from "@/lib/rbac";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  console.info("[api/documents/process] request received", { documentId: params.id });
  const user = await requireAuth();
  if (!canEditDocument(user.role)) {
    console.warn("[api/documents/process] forbidden", {
      documentId: params.id,
      userId: user.id,
      role: user.role,
    });
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const document = await getDocumentById(params.id);
  if (!document) {
    console.warn("[api/documents/process] document not found", { documentId: params.id });
    return NextResponse.json({ error: "Documento no encontrado." }, { status: 404 });
  }

  try {
    const processed = await processDocumentAssets(params.id);
    console.info("[api/documents/process] completed", {
      documentId: params.id,
      searchStatus: processed?.searchStatus,
      previewStatus: processed?.previewStatus,
    });
    return NextResponse.json({ data: processed });
  } catch (error) {
    console.error("[api/documents/process] failed", {
      documentId: params.id,
      message: error instanceof Error ? error.message : "Erro inesperado.",
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro inesperado." },
      { status: 400 },
    );
  }
}
