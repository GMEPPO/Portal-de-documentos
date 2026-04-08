"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { pushToast } from "@/components/ui/toaster";
import { getDictionary } from "@/lib/dictionary";
import type { Locale } from "@/lib/types";

type CommentItem = {
  id: string;
  content: string;
  createdAt: string;
};

export function DocumentCommentsPanel({
  documentId,
  comments,
  locale,
}: {
  documentId: string;
  comments: CommentItem[];
  locale: Locale;
}) {
  const router = useRouter();
  const dictionary = getDictionary(locale);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
        <p className="mb-3 text-sm font-medium text-slate-100">{dictionary.documents.comments.title}</p>
        <Textarea
          placeholder={dictionary.documents.comments.placeholder}
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
                  title: dictionary.documents.comments.tooShortTitle,
                  description: dictionary.documents.comments.tooShortDescription,
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
                    title: dictionary.documents.comments.saveErrorTitle,
                    description:
                      (data?.error as string | undefined) ??
                      dictionary.documents.comments.saveErrorDescription,
                  });
                  return;
                }

                setContent("");
                pushToast({
                  id: crypto.randomUUID(),
                  title: dictionary.documents.comments.successTitle,
                  description: dictionary.documents.comments.successDescription,
                });
                router.refresh();
              } finally {
                setIsSubmitting(false);
              }
            }}
          >
            {isSubmitting ? dictionary.documents.comments.saving : dictionary.documents.comments.submit}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {comments.length === 0 && (
          <p className="text-slate-400">{dictionary.documents.comments.empty}</p>
        )}
        {comments.map((item) => (
          <div key={item.id} className="rounded border border-slate-700 p-3">
            <p className="text-sm text-slate-200">{item.content}</p>
            <p className="mt-2 text-xs text-slate-400">
              {new Date(item.createdAt).toLocaleString(locale)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
