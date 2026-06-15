"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { pushToast } from "@/components/ui/toaster";
import { getDictionary } from "@/lib/dictionary";
import { interpolate } from "@/lib/i18n-shared";
import type { Locale } from "@/lib/types";

export function DocumentDeleteButton({
  documentId,
  documentTitle,
  locale,
}: {
  documentId: string;
  documentTitle: string;
  locale: Locale;
}) {
  const router = useRouter();
  const dictionary = getDictionary(locale);

  return (
    <Button
      variant="outline"
      className="border-red-500/40 text-red-200 hover:bg-red-500/10 hover:text-red-100"
      onClick={async () => {
        const confirmed = window.confirm(
          interpolate(dictionary.documents.delete.confirm, { title: documentTitle }),
        );
        if (!confirmed) return;

        const response = await fetch(`/api/documents/${documentId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          pushToast({
            id: crypto.randomUUID(),
            title: dictionary.documents.delete.errorTitle,
            description:
              (data?.error as string | undefined) ??
              dictionary.documents.delete.errorDescription,
          });
          return;
        }

        pushToast({
          id: crypto.randomUUID(),
          title: dictionary.documents.delete.successTitle,
          description: dictionary.documents.delete.successDescription,
        });
        router.push("/documents");
        router.refresh();
      }}
    >
      {dictionary.documents.delete.button}
    </Button>
  );
}
