"use client";

import { useRouter } from "next/navigation";
import { DocumentForm } from "@/components/documents/document-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { pushToast } from "@/components/ui/toaster";
import type { DocumentCategory, Locale } from "@/lib/types";
import { getDictionary } from "@/lib/dictionary";

export function NewDocumentClient({
  locale,
  categories,
  availableTags,
}: {
  locale: Locale;
  categories: DocumentCategory[];
  availableTags: string[];
}) {
  const router = useRouter();
  const dictionary = getDictionary(locale);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dictionary.documents.new.title}</CardTitle>
        <CardDescription>{dictionary.documents.new.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <DocumentForm
          categories={categories}
          availableTags={availableTags}
          labels={{
            unsupportedTitle: dictionary.documents.new.unsupportedTitle,
            unsupportedDescription: dictionary.documents.new.unsupportedDescription,
            titlePlaceholder: dictionary.documents.form.titlePlaceholder,
            summaryPlaceholder: dictionary.documents.form.summaryPlaceholder,
            categoryPlaceholder: dictionary.documents.form.categoryPlaceholder,
            noCategory: dictionary.documents.form.noCategory,
            departmentPlaceholder: dictionary.documents.form.departmentPlaceholder,
            selectDepartment: dictionary.documents.form.selectDepartment,
            versionPlaceholder: dictionary.documents.form.versionPlaceholder,
            tagsTitle: dictionary.documents.form.tagsTitle,
            tagsHint: dictionary.documents.form.tagsHint,
            internalNotesPlaceholder: dictionary.documents.form.internalNotesPlaceholder,
            save: dictionary.documents.form.save,
            filePicker: {
              attach: dictionary.documents.filePicker.attach,
              helper: dictionary.documents.filePicker.helper,
              browse: dictionary.documents.filePicker.browse,
              remove: dictionary.documents.filePicker.remove,
              defaultTypes: dictionary.documents.filePicker.defaultTypes,
            },
          }}
          onSubmit={async (values, files) => {
            if (files.length === 0) {
              pushToast({
                id: crypto.randomUUID(),
                title: dictionary.documents.new.fileRequiredTitle,
                description: dictionary.documents.new.fileRequiredDescription,
              });
              return;
            }

            const formData = new FormData();
            formData.append("title", values.title);
            formData.append("summary", values.summary);
            if (values.categoryId) formData.append("categoryId", values.categoryId);
            formData.append("department", values.department);
            formData.append("versionNumber", String(values.versionNumber));
            if (values.internalNotes) formData.append("internalNotes", values.internalNotes);
            for (const tag of values.tags ?? []) {
              formData.append("tags[]", tag);
            }
            for (const file of files) {
              formData.append("files[]", file, file.name);
            }

            const response = await fetch("/api/documents", { method: "POST", body: formData });
            if (!response.ok) {
              const data = await response.json().catch(() => null);
              pushToast({
                id: crypto.randomUUID(),
                title: dictionary.documents.new.createFailureTitle,
                description:
                  (data?.error as string | undefined) ?? dictionary.documents.new.createFailureDescription,
              });
              return;
            }

            const data = await response.json().catch(() => null);
            const documentId = data?.data?.id as string | undefined;
            if (documentId) {
              void fetch(`/api/documents/${documentId}/process`, { method: "POST", keepalive: true }).catch(() => null);
            }

            pushToast({
              id: crypto.randomUUID(),
              title: dictionary.documents.new.createdTitle,
              description: dictionary.documents.new.createdDescription,
            });
            router.push("/documents");
          }}
        />
      </CardContent>
    </Card>
  );
}

