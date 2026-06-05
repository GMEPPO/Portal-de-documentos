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
    <Button asChild size="sm" className="h-8 px-4 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white border-0 shadow-sm shadow-blue-900/40">
      <Link href={`/documents/${documentId}/edit?mode=${publishMode}`}>
        {dictionary.documents.workflow.publish}
      </Link>
    </Button>
  );
}
