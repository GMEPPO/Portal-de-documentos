"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DocumentFilePicker } from "@/components/documents/document-file-picker";
import { documentCreateSchema, type DocumentCreateInput } from "@/lib/validations";
import { pushToast } from "@/components/ui/toaster";
import type { DocumentStatus } from "@/lib/types";

export function DocumentVersionForm({
  documentId,
  mode,
  initialValues,
}: {
  documentId: string;
  mode: "update" | "publish";
  initialValues: Pick<
    DocumentCreateInput,
    "title" | "summary" | "department" | "internalNotes"
  > & {
    nextVersionNumber: number;
    currentFileUrl?: string | null;
    currentFilename?: string | null;
  };
}) {
  const router = useRouter();
  const [mainFile, setMainFile] = useState<File | null>(null);
  const form = useForm<DocumentCreateInput>({
    resolver: zodResolver(documentCreateSchema),
    defaultValues: {
      title: initialValues.title,
      summary: initialValues.summary,
      categoryId: "",
      department: initialValues.department,
      versionNumber: initialValues.nextVersionNumber,
      ownerId: "",
      tags: [],
      internalNotes: initialValues.internalNotes ?? "",
    },
  });

  const targetStatus: DocumentStatus = mode === "publish" ? "published" : "updating";

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(async (values) => {
        if (!mainFile) {
          pushToast({
            id: crypto.randomUUID(),
            title: "Ficheiro obrigatorio",
            description: "Debes adjuntar un ficheiro antes de continuar.",
          });
          return;
        }

        if (mode === "publish" && !mainFile.name.toLowerCase().endsWith(".pdf")) {
          pushToast({
            id: crypto.randomUUID(),
            title: "PDF obrigatorio",
            description: "Para publicar, debes subir un PDF.",
          });
          return;
        }

        const formData = new FormData();
        formData.append("mainFile", mainFile, mainFile.name);
        formData.append("versionNumber", String(values.versionNumber));
        formData.append("summary", values.summary);
        formData.append("department", values.department);
        formData.append("statusAfterUpload", targetStatus);
        formData.append(
          "changelog",
          mode === "publish"
            ? `Version V${String(values.versionNumber).padStart(3, "0")} publicada`
            : `Nova versao V${String(values.versionNumber).padStart(3, "0")} carregada`,
        );
        if (values.internalNotes) {
          formData.append("internalNotes", values.internalNotes);
        }

        const response = await fetch(`/api/documents/${documentId}/versions`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          pushToast({
            id: crypto.randomUUID(),
            title: "Nao foi possivel guardar a versao",
            description:
              (data?.error as string | undefined) ?? "Erro ao guardar a nova versao.",
          });
          return;
        }

        pushToast({
          id: crypto.randomUUID(),
          title: mode === "publish" ? "Documento publicado" : "Versao carregada",
          description:
            mode === "publish"
              ? "O PDF foi publicado com sucesso."
              : "A nova versao ficou em atualizacao.",
        });
        router.push(`/documents/${documentId}`);
        router.refresh();
      })}
    >
      <Input readOnly value={initialValues.title} />
      {initialValues.currentFileUrl && (
        <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4 text-sm text-slate-300">
          <p className="font-medium text-slate-100">Ficheiro atual</p>
          <p className="mt-1 text-xs text-slate-400">
            {initialValues.currentFilename ?? "Documento atual disponivel para descarga."}
          </p>
          <div className="mt-3">
            <Button asChild type="button" variant="outline">
              <a href={initialValues.currentFileUrl} target="_blank" rel="noreferrer">
                Descargar ficheiro atual
              </a>
            </Button>
          </div>
        </div>
      )}
      <Textarea placeholder="Resumo tecnico" {...form.register("summary")} />
      <Input placeholder="Departamento" {...form.register("department")} />
      <Input
        type="number"
        min={1}
        placeholder="Versao"
        {...form.register("versionNumber", { valueAsNumber: true })}
      />
      <Textarea placeholder="Notas internas" {...form.register("internalNotes")} />
      <DocumentFilePicker onFileChange={setMainFile} />
      <Button type="submit">
        {mode === "publish" ? "Publicar PDF" : "Guardar nova versao"}
      </Button>
    </form>
  );
}
