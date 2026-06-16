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
  labels,
}: {
  onSubmit: (values: DocumentCreateInput, mainFile: File | null) => Promise<void>;
  categories: DocumentCategory[];
  labels: {
    unsupportedTitle: string;
    unsupportedDescription: string;
    titlePlaceholder: string;
    summaryPlaceholder: string;
    categoryPlaceholder: string;
    noCategory: string;
    departmentPlaceholder: string;
    selectDepartment: string;
    versionPlaceholder: string;
    tagsTitle?: string;
    tagsHint?: string;
    internalNotesPlaceholder: string;
    save: string;
    filePicker: {
      attach: string;
      helper: string;
      browse: string;
      remove: string;
      defaultTypes: string;
    };
  };
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
            title: labels.unsupportedTitle,
            description: labels.unsupportedDescription,
          });
          return;
        }

        await onSubmit(values, mainFile);
        form.reset();
        setMainFile(null);
      })}
    >
      <Input placeholder={labels.titlePlaceholder} {...form.register("title")} />
      <Textarea placeholder={labels.summaryPlaceholder} {...form.register("summary")} />
      <Select
        value={form.watch("categoryId") || "__none__"}
        onValueChange={(value) =>
          form.setValue("categoryId", value === "__none__" ? "" : value, {
            shouldValidate: true,
          })
        }
      >
        <SelectTrigger>
          <SelectValue placeholder={labels.categoryPlaceholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">{labels.noCategory}</SelectItem>
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
          <SelectValue placeholder={labels.departmentPlaceholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">{labels.selectDepartment}</SelectItem>
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
        placeholder={labels.versionPlaceholder}
        {...form.register("versionNumber", { valueAsNumber: true })}
      />
      <Textarea placeholder={labels.internalNotesPlaceholder} {...form.register("internalNotes")} />
      <DocumentFilePicker
        onFileChange={setMainFile}
        labels={labels.filePicker}
      />
      <Button type="submit">{labels.save}</Button>
    </form>
  );
}
