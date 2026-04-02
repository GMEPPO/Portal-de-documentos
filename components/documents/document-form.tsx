"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { documentCreateSchema, type DocumentCreateInput } from "@/lib/validations";
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
import type { DocumentCategory } from "@/lib/types";
import { getDocumentFileType } from "@/lib/document-file";
import { pushToast } from "@/components/ui/toaster";
import { departmentOptions } from "@/lib/constants";

export function DocumentForm({
  onSubmit,
  categories,
}: {
  onSubmit: (values: DocumentCreateInput, mainFile: File | null) => Promise<void>;
  categories: DocumentCategory[];
}) {
  const [mainFile, setMainFile] = useState<File | null>(null);
  const form = useForm<DocumentCreateInput>({
    resolver: zodResolver(documentCreateSchema),
    defaultValues: {
      title: "",
      summary: "",
      categoryId: "",
      department: "",
      versionNumber: 1,
      ownerId: "",
      tags: [],
      internalNotes: "",
    },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(async (values) => {
        if (mainFile && !getDocumentFileType(mainFile.name)) {
          pushToast({
            id: crypto.randomUUID(),
            title: "Formato nao suportado",
            description: "Usa apenas ficheiros PDF, Word, MP4 ou MP3.",
          });
          return;
        }

        await onSubmit(values, mainFile);
        form.reset();
        setMainFile(null);
      })}
    >
      <Input placeholder="Titulo" {...form.register("title")} />
      <Textarea placeholder="Resumo tecnico" {...form.register("summary")} />
      <Select
        value={form.watch("categoryId") || "__none__"}
        onValueChange={(value) =>
          form.setValue("categoryId", value === "__none__" ? "" : value, {
            shouldValidate: true,
          })
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">Sem categoria</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
        {...form.register("versionNumber", { valueAsNumber: true })}
      />
      <Textarea placeholder="Notas internas" {...form.register("internalNotes")} />
      <DocumentFilePicker onFileChange={setMainFile} />
      <Button type="submit">Guardar documento</Button>
    </form>
  );
}
