"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { pushToast } from "@/components/ui/toaster";

export function DocumentDeleteButton({
  documentId,
  documentTitle,
}: {
  documentId: string;
  documentTitle: string;
}) {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      className="border-red-500/40 text-red-200 hover:bg-red-500/10 hover:text-red-100"
      onClick={async () => {
        const confirmed = window.confirm(
          `Vas a eliminar "${documentTitle}" y todo lo relacionado con este documento. Esta accion es permanente.`,
        );
        if (!confirmed) return;

        const response = await fetch(`/api/documents/${documentId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          pushToast({
            id: crypto.randomUUID(),
            title: "Nao foi possivel eliminar o documento",
            description:
              (data?.error as string | undefined) ??
              "Erro ao eliminar o documento e os ficheiros associados.",
          });
          return;
        }

        pushToast({
          id: crypto.randomUUID(),
          title: "Documento eliminado",
          description: "O documento e todos os dados associados foram removidos.",
        });
        router.push("/documents");
        router.refresh();
      }}
    >
      Eliminar documento
    </Button>
  );
}
