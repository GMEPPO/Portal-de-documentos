"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { pushToast } from "@/components/ui/toaster";
import { documentStatusLabels } from "@/lib/rbac";
import type { DocumentStatus } from "@/lib/types";

export function DocumentWorkflowActions({
  documentId,
  currentStatus,
}: {
  documentId: string;
  currentStatus: DocumentStatus;
}) {
  const router = useRouter();

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
        <Button
          onClick={async () => {
            const response = await fetch(`/api/documents/${documentId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "updating" }),
            });

            if (!response.ok) {
              const data = await response.json().catch(() => null);
              pushToast({
                id: crypto.randomUUID(),
                title: "Nao foi possivel entrar em atualizacao",
                description:
                  (data?.error as string | undefined) ?? "Erro ao atualizar o estado.",
              });
              return;
            }

            router.push(`/documents/${documentId}/edit?mode=update`);
            router.refresh();
          }}
        >
          Atualizar documento
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
