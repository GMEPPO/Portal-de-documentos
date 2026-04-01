import { NextResponse } from "next/server";
import { deleteDocument, getDocumentById, updateDocument } from "@/lib/documents-service";
import { requireAuth } from "@/lib/auth";
import { canAccessDocumentStatus, canEditDocument } from "@/lib/rbac";
import { deleteDocumentFiles } from "@/lib/storage-service";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const user = await requireAuth();
  const doc = await getDocumentById(params.id);
  if (!doc) {
    return NextResponse.json({ error: "Documento no encontrado." }, { status: 404 });
  }
  if (!canAccessDocumentStatus(user.role, doc.status)) {
    return NextResponse.json({ error: "Documento no encontrado." }, { status: 404 });
  }
  return NextResponse.json({ data: doc });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await requireAuth();
  const body = await request.json();
  try {
    const doc = await updateDocument(params.id, body, user);
    return NextResponse.json({ data: doc });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro inesperado." },
      { status: 400 },
    );
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const user = await requireAuth();
  if (!canEditDocument(user.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  try {
    const deleted = await deleteDocument(params.id, user);
    await deleteDocumentFiles(deleted.paths);
    return NextResponse.json({ data: deleted.document });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro inesperado." },
      { status: 400 },
    );
  }
}
