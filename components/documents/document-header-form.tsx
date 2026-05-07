"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TagsPicker } from "@/components/documents/tags-picker";
import { pushToast } from "@/components/ui/toaster";
import { departmentOptions } from "@/lib/constants";

export function DocumentHeaderForm({
  documentId,
  initialValues,
  availableTags,
}: {
  documentId: string;
  initialValues: {
    title: string;
    summary: string;
    department: string;
    tags: string[];
  };
  availableTags: string[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialValues.title);
  const [summary, setSummary] = useState(initialValues.summary);
  const [department, setDepartment] = useState(initialValues.department);
  const [tags, setTags] = useState<string[]>(initialValues.tags);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 4) {
      pushToast({ id: crypto.randomUUID(), title: "Título obrigatório", description: "O título deve ter pelo menos 4 caracteres." });
      return;
    }
    if (summary.trim().length < 8) {
      pushToast({ id: crypto.randomUUID(), title: "Resumo obrigatório", description: "O resumo deve ter pelo menos 8 caracteres." });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), summary: summary.trim(), department, tags }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        pushToast({
          id: crypto.randomUUID(),
          title: "Não foi possível guardar",
          description: (data?.error as string | undefined) ?? "Erro ao guardar o documento.",
        });
        return;
      }

      pushToast({ id: crypto.randomUUID(), title: "Documento atualizado", description: "As alterações foram guardadas com sucesso." });
      router.push(`/documents/${documentId}`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block space-y-2">
        <span className="text-sm text-slate-300">Nome *</span>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          minLength={4}
          maxLength={180}
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm text-slate-300">Departamento *</span>
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          required
          className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500"
        >
          {departmentOptions.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </label>

      <label className="block space-y-2">
        <span className="text-sm text-slate-300">Resumo *</span>
        <Textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          required
          minLength={8}
          maxLength={1000}
          rows={4}
        />
      </label>

      <div className="space-y-2">
        <span className="text-sm text-slate-300">Tags</span>
        <TagsPicker
          availableTags={availableTags}
          selectedTags={tags}
          onChange={setTags}
          labels={{ title: "Tags", hint: "Seleciona os departamentos envolvidos (e outras tags úteis)." }}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={saving}>
          {saving ? "A guardar..." : "Guardar alterações"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={saving}
          onClick={() => router.push(`/documents/${documentId}`)}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
