"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { pushToast } from "@/components/ui/toaster";
import { getDictionary } from "@/lib/dictionary";
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
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
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
        setDeleting(false);
        setOpen(false);
        return;
      }

      pushToast({
        id: crypto.randomUUID(),
        title: dictionary.documents.delete.successTitle,
        description: dictionary.documents.delete.successDescription,
      });
      router.push("/documents");
      router.refresh();
    } catch {
      pushToast({
        id: crypto.randomUUID(),
        title: dictionary.documents.delete.errorTitle,
        description: dictionary.documents.delete.errorDescription,
      });
      setDeleting(false);
      setOpen(false);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        className="border-red-500/40 text-red-300 hover:border-red-500/70 hover:bg-red-500/10 hover:text-red-200"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="mr-1.5 h-4 w-4" />
        {dictionary.documents.delete.button}
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!deleting) setOpen(v); }}>
        <DialogContent className="max-w-md border-red-500/30 bg-slate-900 p-0">
          <div className="p-6 space-y-4">
            {/* Ícone + título */}
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-100">
                  Eliminar documento permanentemente
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Esta ação é{" "}
                  <span className="font-semibold text-red-400">irreversível</span>{" "}
                  e não pode ser desfeita.
                </p>
              </div>
            </div>

            {/* Lista do que será apagado */}
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm">
              <p className="mb-2 font-medium text-slate-200">
                Ao confirmar, serão eliminados permanentemente:
              </p>
              <ul className="space-y-1.5 text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-red-400 shrink-0">•</span>
                  O documento{" "}
                  <span className="font-medium text-slate-300">"{documentTitle}"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-red-400 shrink-0">•</span>
                  Todas as versões e histórico de versões
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-red-400 shrink-0">•</span>
                  Todos os ficheiros anexados (PDFs, vídeos, etc.)
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-red-400 shrink-0">•</span>
                  Todos os comentários e registos de auditoria
                </li>
              </ul>
            </div>

            {/* Botões */}
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
                disabled={deleting}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    A eliminar…
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar permanentemente
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
