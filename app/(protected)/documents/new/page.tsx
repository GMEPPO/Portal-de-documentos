"use client";

import { useRouter } from "next/navigation";
import { DocumentForm } from "@/components/documents/document-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { pushToast } from "@/components/ui/toaster";
import { mockCategories } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { getDocumentFileType, getDocumentFileTypeLabel } from "@/lib/document-file";

export default function NewDocumentPage() {
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Novo documento</CardTitle>
        <CardDescription>Registo inicial de metadados e classificacao.</CardDescription>
      </CardHeader>
      <CardContent>
        <DocumentForm
          categories={mockCategories}
          onSubmit={async (values, mainFile) => {
            if (!mainFile) {
              pushToast({
                id: crypto.randomUUID(),
                title: "Ficheiro obrigatorio",
                description: "Debes adjuntar un ficheiro para criar o documento.",
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

            if (fileType === "video" || fileType === "audio") {
              const supabase = createSupabaseBrowserClient();
              if (!supabase) {
                pushToast({
                  id: crypto.randomUUID(),
                  title: "Supabase indisponivel",
                  description: "Nao foi possivel inicializar o cliente de upload.",
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
                  title: "Nao foi possivel preparar o tutorial",
                  description:
                    (prepareData?.error as string | undefined) ??
                    "Falha ao preparar o upload multimedia.",
                });
                return;
              }

              const documentId = prepareData?.data?.documentId as string | undefined;
              const objectPath = prepareData?.data?.objectPath as string | undefined;
              const bucket = prepareData?.data?.bucket as string | undefined;

              if (!documentId || !objectPath || !bucket) {
                pushToast({
                  id: crypto.randomUUID(),
                  title: "Resposta incompleta",
                  description: "Nao foi possivel obter o destino de upload multimedia.",
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
                  title: "Falha no upload do ficheiro",
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
                  title: "Nao foi possivel finalizar o tutorial",
                  description:
                    (finalizeData?.error as string | undefined) ??
                    "Falha ao registar o upload multimedia.",
                });
                return;
              }

              pushToast({
                id: crypto.randomUUID(),
                title: "Conteudo multimedia criado",
                description: `${getDocumentFileTypeLabel(fileType)} carregado com sucesso. Podera ser reproduzido na web depois de publicado.`,
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
                "Falha ao criar documento.";
              pushToast({
                id: crypto.randomUUID(),
                title: "Nao foi possivel criar o documento",
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
              title: "Documento criado",
              description: "O registo foi criado com sucesso. A indexacao da pesquisa sera enviada ao n8n em segundo plano.",
            });
            router.push("/documents");
          }}
        />
      </CardContent>
    </Card>
  );
}
