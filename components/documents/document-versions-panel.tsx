"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { pushToast } from "@/components/ui/toaster";

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
}: {
  documentId: string;
  versions: VersionItem[];
  canDelete: boolean;
  currentVersion: number;
}) {
  const router = useRouter();

  if (versions.length === 0) {
    return <p className="text-slate-400">Sem versoes extra.</p>;
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
                    Ver
                  </a>
                </Button>
                <Button asChild size="sm">
                  <a href={item.fileUrl} target="_blank" rel="noreferrer" download>
                    Descargar
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
                    `Se eliminares a versao V${item.versionNumber}, sera apagada de forma permanente e nao podera ser recuperada.`,
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
                      title: "Nao foi possivel eliminar a versao",
                      description:
                        (data?.error as string | undefined) ??
                        "Erro ao eliminar a versao.",
                    });
                    return;
                  }

                  pushToast({
                    id: crypto.randomUUID(),
                    title: "Versao eliminada",
                    description: `A versao V${item.versionNumber} foi eliminada com sucesso.`,
                  });
                  router.refresh();
                }}
              >
                Eliminar
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
