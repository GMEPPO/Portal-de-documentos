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
  searchStatus,
  searchError,
  canRetry,
}: {
  documentId: string;
  fileType: DocumentFileType;
  searchStatus: DocumentProcessingStatus;
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
        title: "Indexacao enviada",
        description: "O pedido de indexacao foi enviado ao n8n com sucesso.",
      });
    }

    router.refresh();
  }

  useEffect(() => {
    if (autoStarted.current) return;
    if (!shouldAutoStartDocumentProcessing(fileType, searchStatus)) return;

    autoStarted.current = true;
    void runProcessing(false);
  }, [documentId, fileType, searchStatus]);

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-100">Indexacao do documento</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge>Pesquisa: {documentProcessingStatusLabels[searchStatus]}</Badge>
          </div>
          {searchError && <p className="text-xs text-amber-300">Pesquisa: {searchError}</p>}
          {(isProcessing ||
            searchStatus === "pending" ||
            searchStatus === "processing") && (
            <p className="text-xs text-slate-400">
              A plataforma esta a enviar ou a acompanhar a indexacao da pesquisa em segundo plano.
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
