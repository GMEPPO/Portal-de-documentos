"use client";

import { useRouter } from "next/navigation";
import { DocumentForm } from "@/components/documents/document-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { pushToast } from "@/components/ui/toaster";
import { mockCategories } from "@/lib/constants";
import { getDictionary } from "@/lib/dictionary";
import { getDocumentFileTypeLabel, interpolate, resolveLocale } from "@/lib/i18n-shared";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { getDocumentFileType } from "@/lib/document-file";

export default function NewDocumentPage() {
  const router = useRouter();
  const locale = resolveLocale(typeof document !== "undefined" ? document.documentElement.lang : "pt-PT");
  const dictionary = getDictionary(locale);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dictionary.documents.new.title}</CardTitle>
        <CardDescription>{dictionary.documents.new.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <DocumentForm
          categories={mockCategories}
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
          onSubmit={async (values, mainFile) => {
            if (!mainFile) {
              pushToast({
                id: crypto.randomUUID(),
                title: dictionary.documents.new.fileRequiredTitle,
                description: dictionary.documents.new.fileRequiredDescription,
              });
              return;
            }

            const fileType = getDocumentFileType(mainFile.name);
            if (!fileType) {
              pushToast({
                id: crypto.randomUUID(),
                title: dictionary.documents.new.unsupportedTitle,
                description: dictionary.documents.new.unsupportedDescription,
              });
              return;
            }

            if (fileType === "video" || fileType === "audio") {
              const supabase = createSupabaseBrowserClient();
              if (!supabase) {
                pushToast({
                  id: crypto.randomUUID(),
                  title: dictionary.documents.new.supabaseTitle,
                  description: dictionary.documents.new.supabaseDescription,
                });
                return;
              }

              const prepareResponse = await fetch("/api/documents/media/prepare", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  ...values,
                  filename: mainFile.name,
                }),
              });

              const prepareData = await prepareResponse.json().catch(() => null);
              if (!prepareResponse.ok) {
                pushToast({
                  id: crypto.randomUUID(),
                  title: dictionary.documents.new.prepareMediaTitle,
                  description:
                    (prepareData?.error as string | undefined) ??
                    dictionary.documents.new.prepareMediaDescription,
                });
                return;
              }

              const documentId = prepareData?.data?.documentId as string | undefined;
              const objectPath = prepareData?.data?.objectPath as string | undefined;
              const bucket = prepareData?.data?.bucket as string | undefined;

              if (!documentId || !objectPath || !bucket) {
                pushToast({
                  id: crypto.randomUUID(),
                  title: dictionary.documents.new.incompleteTitle,
                  description: dictionary.documents.new.incompleteDescription,
                });
                return;
              }

              const uploadResult = await supabase.storage
                .from(bucket)
                .upload(objectPath, mainFile, { upsert: true });

              if (uploadResult.error) {
                await fetch(`/api/documents/${documentId}`, {
                  method: "DELETE",
                }).catch(() => null);

                pushToast({
                  id: crypto.randomUUID(),
                  title: dictionary.documents.new.uploadFailureTitle,
                  description: uploadResult.error.message,
                });
                return;
              }

              const finalizeResponse = await fetch("/api/documents/media/finalize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  documentId,
                  objectPath,
                  filename: mainFile.name,
                  versionNumber: values.versionNumber,
                  changelog: `Inicial (V${String(values.versionNumber).padStart(3, "0")}) - upload do ficheiro principal`,
                }),
              });

              const finalizeData = await finalizeResponse.json().catch(() => null);
              if (!finalizeResponse.ok) {
                pushToast({
                  id: crypto.randomUUID(),
                  title: dictionary.documents.new.finalizeMediaTitle,
                  description:
                    (finalizeData?.error as string | undefined) ??
                    dictionary.documents.new.finalizeMediaDescription,
                });
                return;
              }

              pushToast({
                id: crypto.randomUUID(),
                title: dictionary.documents.new.mediaSuccessTitle,
                description: interpolate(dictionary.documents.new.mediaCreatedDescription, {
                  fileType: getDocumentFileTypeLabel(fileType, locale),
                }),
              });
              router.push("/documents");
              return;
            }

            const formData = new FormData();
            formData.append("title", values.title);
            formData.append("summary", values.summary);
            if (values.categoryId) {
              formData.append("categoryId", values.categoryId);
            }
            formData.append("department", values.department);
            formData.append("versionNumber", String(values.versionNumber));
            if (values.internalNotes) {
              formData.append("internalNotes", values.internalNotes);
            }
            formData.append("mainFile", mainFile, mainFile.name);

            const response = await fetch("/api/documents", {
              method: "POST",
              body: formData,
            });
            if (!response.ok) {
              const data = await response.json().catch(() => null);
              const message =
                (data?.error as string | undefined) ??
                dictionary.documents.new.createFailureDescription;
              pushToast({
                id: crypto.randomUUID(),
                title: dictionary.documents.new.createFailureTitle,
                description: message,
              });
              return;
            }

            const data = await response.json().catch(() => null);
            const documentId = data?.data?.id as string | undefined;
            if (documentId) {
              console.info("[new-document-page] triggering /process", {
                documentId,
                filename: mainFile.name,
              });
              void fetch(`/api/documents/${documentId}/process`, {
                method: "POST",
                keepalive: true,
              })
                .then(async (processResponse) => {
                  const processBody = await processResponse.json().catch(() => null);
                  console.info("[new-document-page] /process response", {
                    documentId,
                    status: processResponse.status,
                    ok: processResponse.ok,
                    body: processBody,
                  });
                })
                .catch((error) => {
                  console.error("[new-document-page] /process failed", {
                    documentId,
                    message: error instanceof Error ? error.message : "unknown error",
                  });
              });
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
