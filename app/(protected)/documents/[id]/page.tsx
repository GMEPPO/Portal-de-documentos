import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentCommentsPanel } from "@/components/documents/document-comments-panel";
import { DocumentDeleteButton } from "@/components/documents/document-delete-button";
import { DocumentFileViewer } from "@/components/documents/document-file-viewer";
import { DocumentProcessingPanel } from "@/components/documents/document-processing-panel";
import { DocumentVersionsPanel } from "@/components/documents/document-versions-panel";
import { DocumentWorkflowActions } from "@/components/documents/document-workflow-actions";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireAuth } from "@/lib/auth";
import { getDocumentById, listDocumentHistory } from "@/lib/documents-service";
import { getCategoryNameById } from "@/lib/constants";
import { canAccessDocumentStatus, canEditDocument } from "@/lib/rbac";
import { getDocumentFileSignedUrl } from "@/lib/storage-service";
import type { DocumentAuditRecord } from "@/lib/types";

function formatAuditEvent(item: DocumentAuditRecord) {
  const versionNumber =
    typeof item.metadata?.versionNumber === "number" ? item.metadata.versionNumber : null;

  if (item.event.startsWith("document.version.deleted:")) {
    return versionNumber !== null
      ? `Eliminada a versao V${String(versionNumber).padStart(3, "0")}.`
      : "Eliminada uma versao antiga do documento.";
  }

  if (item.event.startsWith("document.version:")) {
    return versionNumber !== null
      ? `Carregada a versao V${String(versionNumber).padStart(3, "0")}.`
      : "Carregada uma nova versao do documento.";
  }

  if (item.event.startsWith("document.created:")) return "Documento criado.";
  if (item.event.startsWith("document.updated:")) {
    return "Metadados ou estado do documento atualizados.";
  }
  if (item.event.startsWith("document.comment:")) {
    return "Adicionado um comentario ao documento.";
  }

  return item.event;
}

export default async function DocumentDetailPage({ params }: { params: { id: string } }) {
  const user = await requireAuth();
  const doc = await getDocumentById(params.id);
  if (!doc) notFound();
  if (!canAccessDocumentStatus(user.role, doc.status)) notFound();
  const history = await listDocumentHistory(doc.id);
  const canManageDocument = canEditDocument(user.role);
  const readableFilePath = doc.previewFilePath ?? doc.mainFilePath;
  const fileUrl = readableFilePath
    ? await getDocumentFileSignedUrl(readableFilePath)
    : null;
  const readableFilename = readableFilePath?.split("/").pop() ?? doc.title;
  const versions = await Promise.all(
    history.versions.map(async (item) => ({
      ...item,
      fileUrl: await getDocumentFileSignedUrl(item.filePath),
      filename: item.filePath.split("/").pop() ?? `v${item.versionNumber}`,
    })),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{doc.title}</h1>
          <p className="text-slate-400">{doc.summary}</p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
            <DocumentStatusBadge status={doc.status} />
            <Badge>{doc.currentVersion > 0 ? `v${doc.currentVersion}` : "-"}</Badge>
            {canManageDocument && (
              <Button asChild variant="outline">
                <Link href={`/documents/${doc.id}/edit?mode=update`}>Editar</Link>
              </Button>
            )}
            {canManageDocument && (
              <DocumentDeleteButton documentId={doc.id} documentTitle={doc.title} />
            )}
          </div>
          {canManageDocument && (
            <DocumentWorkflowActions
              documentId={doc.id}
              currentStatus={doc.status}
            />
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Metadados</CardTitle>
          <CardDescription>Informacao estrutural e classificacao.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-slate-300 md:grid-cols-2">
          <p>Departamento: {doc.department}</p>
          <p>Categoria: {doc.categoryId ? getCategoryNameById(doc.categoryId) : "Sem categoria"}</p>
          <p>Tipo: {doc.documentType}</p>
          <p>Responsavel: {doc.ownerId}</p>
          <p>Disponivel para todos: {doc.status === "published" ? "Sim" : "Nao"}</p>
          <p>Atualizado: {new Date(doc.updatedAt).toLocaleString()}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Leitura do documento</CardTitle>
          <CardDescription>Consulta do ficheiro principal diretamente na web.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {doc.documentType === "document" && (
            <DocumentProcessingPanel
              documentId={doc.id}
              fileType={doc.documentType}
              previewStatus={doc.previewStatus}
              searchStatus={doc.searchStatus}
              previewError={doc.previewError}
              searchError={doc.searchError}
              canRetry={
                canManageDocument &&
                (doc.previewStatus === "failed" || doc.searchStatus === "failed")
              }
            />
          )}
          {fileUrl ? (
            <DocumentFileViewer
              fileUrl={fileUrl}
              filename={readableFilename}
              fileType={doc.documentType}
            />
          ) : (
            <div className="rounded-lg border border-dashed border-slate-700 p-6 text-sm text-slate-400">
              Ainda nao existe ficheiro principal associado a este documento.
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="versions">
        <TabsList>
          <TabsTrigger value="versions">Versoes</TabsTrigger>
          <TabsTrigger value="comments">Comentarios</TabsTrigger>
          <TabsTrigger value="audit">Historico</TabsTrigger>
        </TabsList>
        <TabsContent value="versions" className="mt-3">
          <Card>
            <CardContent className="space-y-2 pt-5 text-sm">
              <DocumentVersionsPanel
                documentId={doc.id}
                versions={versions}
                canDelete={canManageDocument}
                currentVersion={doc.currentVersion}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="comments" className="mt-3">
          <Card>
            <CardContent className="space-y-2 pt-5 text-sm">
              <DocumentCommentsPanel
                documentId={doc.id}
                comments={history.comments}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="audit" className="mt-3">
          <Card>
            <CardContent className="space-y-2 pt-5 text-sm">
              {history.audits.length === 0 && <p className="text-slate-400">Sem eventos.</p>}
              {history.audits.map((item) => (
                <p key={item.id} className="rounded border border-slate-700 p-3">
                  {new Date(item.at).toLocaleString()} - {formatAuditEvent(item)}
                </p>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
