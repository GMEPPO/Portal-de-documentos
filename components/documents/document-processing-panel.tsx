"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { pushToast } from "@/components/ui/toaster";
import { getDictionary } from "@/lib/dictionary";
import { getDocumentProcessingStatusLabels } from "@/lib/i18n-shared";
import { shouldAutoStartDocumentProcessing as shouldProcess } from "@/lib/document-processing";
import type { DocumentFileType, DocumentProcessingStatus, Locale } from "@/lib/types";

export function DocumentProcessingPanel({
  documentId,
  fileType,
  searchStatus,
  searchError,
  canRetry,
  locale,
}: {
  documentId: string;
  fileType: DocumentFileType;
  searchStatus: DocumentProcessingStatus;
  searchError?: string;
  canRetry: boolean;
  locale: Locale;
}) {
  const router = useRouter();
  const dictionary = getDictionary(locale);
  const statusLabels = getDocumentProcessingStatusLabels(locale);
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
        title: dictionary.documents.processing.errorTitle,
        description:
          (data?.error as string | undefined) ?? dictionary.documents.processing.errorDescription,
      });
      return;
    }

    if (showSuccessToast) {
      pushToast({
        id: crypto.randomUUID(),
        title: dictionary.documents.processing.successTitle,
        description: dictionary.documents.processing.successDescription,
      });
    }

    router.refresh();
  }

  useEffect(() => {
    if (autoStarted.current) return;
    if (!shouldProcess(fileType, searchStatus)) return;

    autoStarted.current = true;
    void runProcessing(false);
  }, [documentId, fileType, searchStatus]);

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-100">{dictionary.documents.processing.title}</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge>{dictionary.documents.processing.search}: {statusLabels[searchStatus]}</Badge>
          </div>
          {searchError && <p className="text-xs text-amber-300">Pesquisa: {searchError}</p>}
          {(isProcessing ||
            searchStatus === "pending" ||
            searchStatus === "processing") && (
            <p className="text-xs text-slate-400">
              {dictionary.documents.processing.pending}
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
            {isProcessing ? dictionary.documents.processing.retrying : dictionary.documents.processing.retry}
          </Button>
        )}
      </div>
    </div>
  );
}
