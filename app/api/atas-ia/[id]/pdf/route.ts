import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requireAuth } from "@/lib/auth";
import { getAta } from "@/lib/workstream-atas";
import { AtaPdf } from "@/lib/ata-pdf";
import React from "react";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const ata = await getAta(params.id);
  if (!ata) {
    return NextResponse.json({ error: "Ata não encontrada." }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(React.createElement(AtaPdf, { ata }) as any);
  const uint8 = new Uint8Array(buffer);

  const filename = `ata-${ata.workstream}-${ata.meetingDate}.pdf`;

  return new NextResponse(uint8, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
