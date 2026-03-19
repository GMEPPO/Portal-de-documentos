"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { documentCreateSchema, type DocumentCreateInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function DocumentForm({
  onSubmit,
}: {
  onSubmit: (values: DocumentCreateInput) => Promise<void>;
}) {
  const form = useForm<DocumentCreateInput>({
    resolver: zodResolver(documentCreateSchema),
    defaultValues: {
      title: "",
      summary: "",
      categoryId: "cat-procedure",
      department: "",
      ownerId: "u-manager",
      tags: [],
      internalNotes: "",
    },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(async (values) => {
        await onSubmit(values);
        form.reset();
      })}
    >
      <Input placeholder="Titulo" {...form.register("title")} />
      <Textarea placeholder="Resumo tecnico" {...form.register("summary")} />
      <Input placeholder="Departamento" {...form.register("department")} />
      <Textarea placeholder="Notas internas" {...form.register("internalNotes")} />
      <Button type="submit">Guardar documento</Button>
    </form>
  );
}
