"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { pushToast } from "@/components/ui/toaster";
import { documentStatusLabels } from "@/lib/rbac";
import type { DocumentStatus } from "@/lib/types";

export function DocumentStatusActions({
  documentId,
  currentStatus,
  allowedTransitions,
}: {
  documentId: string;
  currentStatus: DocumentStatus;
  allowedTransitions: DocumentStatus[];
}) {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<DocumentStatus | "">("");
  const [isPending, startTransition] = useTransition();

  if (allowedTransitions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-700 bg-slate-900/60 p-3 md:min-w-[260px]">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
        Fluxo do documento
      </p>
      <p className="text-sm text-slate-300">
        Estado atual: <span className="text-slate-100">{documentStatusLabels[currentStatus]}</span>
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Select
          value={selectedStatus}
          onValueChange={(value) => setSelectedStatus(value as DocumentStatus)}
        >
          <SelectTrigger className="min-w-[180px]">
            <SelectValue placeholder="Mudar estado" />
          </SelectTrigger>
          <SelectContent>
            {allowedTransitions.map((status) => (
              <SelectItem key={status} value={status}>
                {documentStatusLabels[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          disabled={!selectedStatus || isPending}
          onClick={() => {
            if (!selectedStatus) return;
            startTransition(async () => {
              const response = await fetch(`/api/documents/${documentId}`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ status: selectedStatus }),
              });

              if (!response.ok) {
                const data = await response.json().catch(() => null);
                pushToast({
                  id: crypto.randomUUID(),
                  title: "Nao foi possivel atualizar o estado",
                  description:
                    (data?.error as string | undefined) ?? "Erro ao atualizar o documento.",
                });
                return;
              }

              pushToast({
                id: crypto.randomUUID(),
                title: "Estado atualizado",
                description: `O documento passou para ${documentStatusLabels[selectedStatus]}.`,
              });
              setSelectedStatus("");
              router.refresh();
            });
          }}
        >
          {isPending ? "A atualizar..." : "Atualizar estado"}
        </Button>
      </div>
    </div>
  );
}
