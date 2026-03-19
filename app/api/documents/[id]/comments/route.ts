import { NextResponse } from "next/server";
import { addComment } from "@/lib/documents-service";
import { requireAuth } from "@/lib/auth";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await requireAuth();
  const body = await request.json();
  try {
    const comment = await addComment(params.id, body, user);
    return NextResponse.json({ data: comment }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro inesperado." },
      { status: 400 },
    );
  }
}
