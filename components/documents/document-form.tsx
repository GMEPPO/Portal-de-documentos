"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { documentCreateSchema, type DocumentCreateInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DocumentFilePicker } from "@/components/documents/document-file-picker";

export function DocumentForm({
  onSubmit,
}: {
  onSubmit: (values: DocumentCreateInput, mainFile: File | null) => Promise<void>;
}) {
  const [mainFile, setMainFile] = useState<File | null>(null);
  const form = useForm<DocumentCreateInput>({
    resolver: zodResolver(documentCreateSchema),
    defaultValues: {
      title: "",
      summary: "",
      categoryId: "",
      department: "",
      ownerId: "",
      tags: [],
      internalNotes: "",
    },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(async (values) => {
        await onSubmit(values, mainFile);
        form.reset();
        setMainFile(null);
      })}
    >
      <Input placeholder="Titulo" {...form.register("title")} />
      <Textarea placeholder="Resumo tecnico" {...form.register("summary")} />
      <Input placeholder="Departamento" {...form.register("department")} />
      <Textarea placeholder="Notas internas" {...form.register("internalNotes")} />
      <DocumentFilePicker onFileChange={setMainFile} />
      <Button type="submit">Guardar documento</Button>
    </form>
  );
}
