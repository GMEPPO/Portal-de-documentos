import { NextResponse } from "next/server";
import { getDocumentById, updateDocument } from "@/lib/documents-service";
import { requireAuth } from "@/lib/auth";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  await requireAuth();
  const doc = getDocumentById(params.id);
  if (!doc) {
    return NextResponse.json({ error: "Documento no encontrado." }, { status: 404 });
  }
  return NextResponse.json({ data: doc });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await requireAuth();
  const body = await request.json();
  try {
    const doc = updateDocument(params.id, body, user);
    return NextResponse.json({ data: doc });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro inesperado." },
      { status: 400 },
    );
  }
}
