"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { pushToast } from "@/components/ui/toaster";

type CommentItem = {
  id: string;
  content: string;
  createdAt: string;
};

export function DocumentCommentsPanel({
  documentId,
  comments,
}: {
  documentId: string;
  comments: CommentItem[];
}) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
        <p className="mb-3 text-sm font-medium text-slate-100">Adicionar comentario</p>
        <Textarea
          placeholder="Escreve aqui uma observacao, correcao ou nota sobre este documento."
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />
        <div className="mt-3 flex justify-end">
          <Button
            disabled={isSubmitting}
            onClick={async () => {
              const trimmed = content.trim();
              if (trimmed.length < 2) {
                pushToast({
                  id: crypto.randomUUID(),
                  title: "Comentario demasiado curto",
                  description: "Escreve pelo menos 2 caracteres.",
                });
                return;
              }

              setIsSubmitting(true);
              try {
                const response = await fetch(`/api/documents/${documentId}/comments`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ content: trimmed }),
                });

                if (!response.ok) {
                  const data = await response.json().catch(() => null);
                  pushToast({
                    id: crypto.randomUUID(),
                    title: "Nao foi possivel guardar o comentario",
                    description:
                      (data?.error as string | undefined) ??
                      "Erro ao guardar o comentario.",
                  });
                  return;
                }

                setContent("");
                pushToast({
                  id: crypto.randomUUID(),
                  title: "Comentario adicionado",
                  description: "O comentario foi registado com sucesso.",
                });
                router.refresh();
              } finally {
                setIsSubmitting(false);
              }
            }}
          >
            {isSubmitting ? "A guardar..." : "Adicionar comentario"}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {comments.length === 0 && (
          <p className="text-slate-400">Sem comentarios registados.</p>
        )}
        {comments.map((item) => (
          <div key={item.id} className="rounded border border-slate-700 p-3">
            <p className="text-sm text-slate-200">{item.content}</p>
            <p className="mt-2 text-xs text-slate-400">
              {new Date(item.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
