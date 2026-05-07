"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/lib/dictionary";
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

  const publishMode =
    currentStatus === "in_review" || currentStatus === "updating"
      ? "publish"
      : null;

  if (!publishMode) return null;

  return (
    <Button asChild size="sm" variant="outline" className="h-8 px-3 text-xs text-slate-200">
      <Link href={`/documents/${documentId}/edit?mode=${publishMode}`}>
        {dictionary.documents.workflow.publish}
      </Link>
    </Button>
  );
}
