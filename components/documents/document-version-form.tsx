"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DocumentFilePicker } from "@/components/documents/document-file-picker";
import { pushToast } from "@/components/ui/toaster";
import type { DocumentStatus } from "@/lib/types";
import { getDocumentFileType, getDocumentFileTypeLabel } from "@/lib/document-file";
import { departmentOptions } from "@/lib/constants";

const documentVersionFormSchema = z.object({
  title: z.string().min(4).max(180),
  summary: z.string().min(8).max(1000),
  department: z.string().min(2).max(100),
  versionNumber: z.coerce.number().int().positive(),
  internalNotes: z.string().max(2000).optional(),
});

type DocumentVersionFormInput = z.infer<typeof documentVersionFormSchema>;

export function DocumentVersionForm({
  documentId,
  mode,
  initialValues,
}: {
  documentId: string;
  mode: "update" | "publish";
  initialValues: Pick<DocumentVersionFormInput, "title" | "summary" | "department" | "internalNotes"> & {
    nextVersionNumber: number;
    currentStatus: DocumentStatus;
    currentFileUrl?: string | null;
    currentFilename?: string | null;
  };
}) {
  const router = useRouter();
  const [mainFile, setMainFile] = useState<File | null>(null);
  const form = useForm<DocumentVersionFormInput>({
    resolver: zodResolver(documentVersionFormSchema),
    defaultValues: {
      title: initialValues.title,
      summary: initialValues.summary,
      department: initialValues.department,
      versionNumber: initialValues.nextVersionNumber,
      internalNotes: initialValues.internalNotes ?? "",
    },
  });

  const targetStatus: DocumentStatus = mode === "publish" ? "published" : "updating";
  const isPublishingReviewedVersion =
    mode === "publish" && initialValues.currentStatus === "in_review";

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(
        async (values) => {
          if (!mainFile) {
            pushToast({
              id: crypto.randomUUID(),
              title: "Ficheiro obrigatorio",
              description: "Debes adjuntar un ficheiro antes de continuar.",
            });
            return;
          }

          const fileType = getDocumentFileType(mainFile.name);
          if (!fileType) {
            pushToast({
              id: crypto.randomUUID(),
              title: "Formato nao suportado",
              description: "Usa apenas ficheiros PDF, Word, MP4 ou MP3.",
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
                ? `${getDocumentFileTypeLabel(fileType)} publicado com sucesso. O preview e a pesquisa interna serao processados em seguida.`
                : "A nova versao ficou em atualizacao. O processamento complementar sera feito em seguida.",
          });
          router.push(`/documents/${documentId}`);
          router.refresh();
        },
        (errors) => {
          const firstError = Object.values(errors)[0];
          pushToast({
            id: crypto.randomUUID(),
            title: "Formulario incompleto",
            description: firstError?.message ?? "Revê os campos antes de continuar.",
          });
        },
      )}
    >
      <Input readOnly {...form.register("title")} />
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
      <Select
        value={form.watch("department") || "__none__"}
        onValueChange={(value) =>
          form.setValue("department", value === "__none__" ? "" : value, {
            shouldValidate: true,
          })
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Departamento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">Seleciona um departamento</SelectItem>
          {departmentOptions.map((department) => (
            <SelectItem key={department} value={department}>
              {department}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="number"
        min={1}
        placeholder="Versao"
        readOnly={isPublishingReviewedVersion}
        {...form.register("versionNumber", { valueAsNumber: true })}
      />
      {isPublishingReviewedVersion && (
        <p className="text-xs text-slate-400">
          Ao publicar um documento em revisao, a plataforma mantem a versao atual.
        </p>
      )}
      <Textarea placeholder="Notas internas" {...form.register("internalNotes")} />
      <DocumentFilePicker onFileChange={setMainFile} />
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting
          ? mode === "publish"
            ? "A publicar..."
            : "A guardar..."
          : mode === "publish"
            ? "Publicar conteudo"
            : "Guardar nova versao"}
      </Button>
    </form>
  );
}
