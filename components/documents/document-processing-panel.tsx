"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { pushToast } from "@/components/ui/toaster";
import {
  documentProcessingStatusLabels,
  shouldAutoStartDocumentProcessing,
} from "@/lib/document-processing";
import type { DocumentFileType, DocumentProcessingStatus } from "@/lib/types";

export function DocumentProcessingPanel({
  documentId,
  fileType,
  previewStatus,
  searchStatus,
  previewError,
  searchError,
  canRetry,
}: {
  documentId: string;
  fileType: DocumentFileType;
  previewStatus: DocumentProcessingStatus;
  searchStatus: DocumentProcessingStatus;
  previewError?: string;
  searchError?: string;
  canRetry: boolean;
}) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const autoStarted = useRef(false);

  async function runProcessing(showSuccessToast = false) {
    setIsProcessing(true);
    const response = await fetch(`/api/documents/${documentId}/process`, {
      method: "POST",
    });
    setIsProcessing(false);

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      pushToast({
        id: crypto.randomUUID(),
        title: "Nao foi possivel processar o documento",
        description:
          (data?.error as string | undefined) ?? "Erro ao gerar preview ou pesquisa interna.",
      });
      return;
    }

    if (showSuccessToast) {
      pushToast({
        id: crypto.randomUUID(),
        title: "Processamento concluido",
        description: "O documento foi atualizado com preview e pesquisa interna disponivel.",
      });
    }

    router.refresh();
  }

  useEffect(() => {
    if (autoStarted.current) return;
    if (!shouldAutoStartDocumentProcessing(fileType, previewStatus, searchStatus)) return;

    autoStarted.current = true;
    void runProcessing(false);
  }, [documentId, fileType, previewStatus, searchStatus]);

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-100">Processamento do documento</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge>Preview: {documentProcessingStatusLabels[previewStatus]}</Badge>
            <Badge>Pesquisa: {documentProcessingStatusLabels[searchStatus]}</Badge>
          </div>
          {previewError && <p className="text-xs text-amber-300">Preview: {previewError}</p>}
          {searchError && <p className="text-xs text-amber-300">Pesquisa: {searchError}</p>}
          {(isProcessing ||
            previewStatus === "pending" ||
            previewStatus === "processing" ||
            searchStatus === "pending" ||
            searchStatus === "processing") && (
            <p className="text-xs text-slate-400">
              A plataforma esta a processar preview e pesquisa interna em segundo plano.
            </p>
          )}
        </div>
        {canRetry && (
          <Button
            type="button"
            variant="outline"
            disabled={isProcessing}
            onClick={() => void runProcessing(true)}
          >
            {isProcessing ? "A processar..." : "Tentar novamente"}
          </Button>
        )}
      </div>
    </div>
  );
}
