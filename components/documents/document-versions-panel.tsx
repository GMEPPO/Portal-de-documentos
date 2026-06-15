"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { pushToast } from "@/components/ui/toaster";
import { getDictionary } from "@/lib/dictionary";
import { interpolate } from "@/lib/i18n-shared";
import type { Locale } from "@/lib/types";

type VersionItem = {
  id: string;
  versionNumber: number;
  changelog: string;
  createdAt: string;
  filePath: string;
  fileUrl: string | null;
  filename: string;
};

export function DocumentVersionsPanel({
  documentId,
  versions,
  canDelete,
  currentVersion,
  locale,
}: {
  documentId: string;
  versions: VersionItem[];
  canDelete: boolean;
  currentVersion: number;
  locale: Locale;
}) {
  const router = useRouter();
  const dictionary = getDictionary(locale);

  if (versions.length === 0) {
    return <p className="text-slate-400">{dictionary.documents.versions.empty}</p>;
  }

  return (
    <div className="space-y-2">
      {versions.map((item) => (
        <div
          key={item.id}
          className="flex flex-col gap-3 rounded border border-slate-700 p-3 md:flex-row md:items-center md:justify-between"
        >
          <div className="space-y-1">
            <p className="font-medium text-slate-100">
              {`v${item.versionNumber} - ${item.changelog}`}
            </p>
            <p className="text-xs text-slate-400">
              {new Date(item.createdAt).toLocaleString()} · {item.filename}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {item.fileUrl && (
              <>
                <Button asChild size="sm" variant="outline">
                  <a href={item.fileUrl} target="_blank" rel="noreferrer">
                    {dictionary.documents.versions.view}
                  </a>
                </Button>
                <Button asChild size="sm">
                  <a href={item.fileUrl} target="_blank" rel="noreferrer" download>
                    {dictionary.documents.versions.download}
                  </a>
                </Button>
              </>
            )}
            {canDelete && item.versionNumber !== currentVersion && (
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  const confirmed = window.confirm(
                    interpolate(dictionary.documents.versions.deleteConfirm, { version: item.versionNumber }),
                  );
                  if (!confirmed) return;

                  const response = await fetch(
                    `/api/documents/${documentId}/versions/${item.id}`,
                    { method: "DELETE" },
                  );

                  if (!response.ok) {
                    const data = await response.json().catch(() => null);
                    pushToast({
                      id: crypto.randomUUID(),
                      title: dictionary.documents.versions.deleteErrorTitle,
                      description:
                        (data?.error as string | undefined) ??
                        dictionary.documents.versions.deleteErrorDescription,
                    });
                    return;
                  }

                  pushToast({
                    id: crypto.randomUUID(),
                      title: dictionary.documents.versions.deletedTitle,
                      description: interpolate(dictionary.documents.versions.deletedDescription, { version: item.versionNumber }),
                    });
                  router.refresh();
                }}
              >
                {dictionary.documents.versions.delete}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
