"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { documentStatusLabels } from "@/lib/rbac";
import type { DocumentStatus } from "@/lib/types";

export function DocumentWorkflowActions({
  documentId,
  currentStatus,
}: {
  documentId: string;
  currentStatus: DocumentStatus;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-700 bg-slate-900/60 p-3 md:min-w-[280px]">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
        Fluxo do documento
      </p>
      <p className="text-sm text-slate-300">
        Estado atual: <span className="text-slate-100">{documentStatusLabels[currentStatus]}</span>
      </p>

      {currentStatus === "in_review" && (
        <Button asChild>
          <Link href={`/documents/${documentId}/edit?mode=publish`}>Publicar conteudo</Link>
        </Button>
      )}

      {currentStatus === "published" && (
        <Button asChild>
          <Link href={`/documents/${documentId}/edit?mode=update`}>Atualizar documento</Link>
        </Button>
      )}

      {currentStatus === "updating" && (
        <Button asChild>
          <Link href={`/documents/${documentId}/edit?mode=publish`}>Publicar nova versao</Link>
        </Button>
      )}
    </div>
  );
}
