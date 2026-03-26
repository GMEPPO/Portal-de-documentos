import { notFound } from "next/navigation";
import { DocumentVersionForm } from "@/components/documents/document-version-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { getDocumentById } from "@/lib/documents-service";
import { canEditDocument } from "@/lib/rbac";
import { getDocumentFileSignedUrl } from "@/lib/storage-service";

export default async function EditDocumentPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { mode?: string };
}) {
  const user = await requireAuth();
  const doc = await getDocumentById(params.id);
  if (!doc) notFound();
  if (!canEditDocument(user.role)) notFound();
  const mode = searchParams?.mode === "publish" ? "publish" : "update";
  const currentFileUrl = doc.mainFilePath
    ? await getDocumentFileSignedUrl(doc.mainFilePath)
    : null;
  const currentFilename = doc.mainFilePath?.split("/").pop() ?? null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "publish" ? "Publicar documento" : "Atualizar documento"}</CardTitle>
        <CardDescription>
          {mode === "publish"
            ? "Sube o PDF final para publicar a versao atual."
            : "Carrega una nova versao do documento mantendo o mesmo nome."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DocumentVersionForm
          documentId={doc.id}
          mode={mode}
          initialValues={{
            title: doc.title,
            summary: doc.summary,
            department: doc.department,
            internalNotes: doc.internalNotes,
            nextVersionNumber: doc.currentVersion + 1,
            currentFileUrl,
            currentFilename,
          }}
        />
      </CardContent>
    </Card>
  );
}
