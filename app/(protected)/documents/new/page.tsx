"use client";

import { useRouter } from "next/navigation";
import { DocumentForm } from "@/components/documents/document-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { pushToast } from "@/components/ui/toaster";
import { mockCategories } from "@/lib/constants";

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
