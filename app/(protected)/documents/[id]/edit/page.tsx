import { notFound } from "next/navigation";
import { DocumentVersionForm } from "@/components/documents/document-version-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { isPdfFilename } from "@/lib/document-file";
import { getDocumentById } from "@/lib/documents-service";
import { canEditDocument } from "@/lib/rbac";

export default async function EditDocumentPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { mode?: string };
}) {
  const user = await requireAuth();
  let doc = null;
  try {
    doc = await getDocumentById(params.id);
  } catch {
    doc = null;
  }
  if (!doc) notFound();
  if (!canEditDocument(user.role)) notFound();
  const mode = searchParams?.mode === "publish" ? "publish" : "update";
  const currentFilename = doc.mainFilePath?.split("/").pop() ?? null;
  const hasReusableReviewPdf =
    mode === "publish" &&
    doc.status === "in_review" &&
    Boolean(currentFilename && isPdfFilename(currentFilename));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "publish" ? "Publicar documento" : "Atualizar documento"}</CardTitle>
        <CardDescription>
          {mode === "publish"
            ? hasReusableReviewPdf
              ? "Podes publicar usando o PDF atual da revisao ou carregar um novo PDF para substituir o existente."
              : "Sube um PDF, Word, MP4 ou MP3 final para publicar a versao atual."
            : "Carrega um novo ficheiro para publicar diretamente uma nova versao. Enquanto nao guardares, o documento atual continua publicado."}
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
            nextVersionNumber:
              mode === "publish" && doc.status === "in_review"
                ? doc.currentVersion
                : doc.currentVersion + 1,
            currentStatus: doc.status,
            currentFileUrl: null,
            currentFilename,
            hasReusableReviewPdf,
          }}
        />
      </CardContent>
    </Card>
  );
}
