"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/lib/dictionary";
import { getDocumentStatusLabels } from "@/lib/i18n-shared";
import type { DocumentStatus, Locale } from "@/lib/types";

export function DocumentWorkflowActions({
  documentId,
  currentStatus,
  locale,
}: {
  documentId: string;
  currentStatus: DocumentStatus;
  locale: Locale;
}) {
  const dictionary = getDictionary(locale);
  const statusLabels = getDocumentStatusLabels(locale);
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-700 bg-slate-900/60 p-3 md:min-w-[280px]">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
        {dictionary.documents.workflow.title}
      </p>
      <p className="text-sm text-slate-300">
        {dictionary.documents.workflow.current}: <span className="text-slate-100">{statusLabels[currentStatus]}</span>
      </p>

      {currentStatus === "in_review" && (
        <Button asChild>
          <Link href={`/documents/${documentId}/edit?mode=publish`}>{dictionary.documents.workflow.publishContent}</Link>
        </Button>
      )}

      {currentStatus === "published" && (
        <Button asChild>
          <Link href={`/documents/${documentId}/edit?mode=update`}>{dictionary.documents.workflow.updateDocument}</Link>
        </Button>
      )}

      {currentStatus === "updating" && (
        <Button asChild>
          <Link href={`/documents/${documentId}/edit?mode=publish`}>{dictionary.documents.workflow.publishVersion}</Link>
        </Button>
      )}
    </div>
  );
}
