"use client";

import { useRouter } from "next/navigation";
import { DocumentForm } from "@/components/documents/document-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { pushToast } from "@/components/ui/toaster";

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
          onSubmit={async (values) => {
            const response = await fetch("/api/documents", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(values),
            });
            if (!response.ok) {
              throw new Error("Falha ao criar documento.");
            }
            pushToast({
              id: crypto.randomUUID(),
              title: "Documento criado",
              description: "O registo foi criado com sucesso.",
            });
            router.push("/documents");
          }}
        />
      </CardContent>
    </Card>
  );
}
