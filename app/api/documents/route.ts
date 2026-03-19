import { NextResponse } from "next/server";
import { createDocument, listDocuments } from "@/lib/documents-service";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  await requireAuth();
  return NextResponse.json({ data: listDocuments() });
}

export async function POST(request: Request) {
  const user = await requireAuth();
  const body = await request.json();
  try {
    const doc = createDocument(body, user);
    return NextResponse.json({ data: doc }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro inesperado." },
      { status: 400 },
    );
  }
}
