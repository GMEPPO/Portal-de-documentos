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
import { getDictionary } from "@/lib/dictionary";
import { getDocumentById, listDocumentHistory } from "@/lib/documents-service";
import { getLocale } from "@/lib/i18n";
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
  const locale = getLocale();
  const dictionary = getDictionary(locale);
  let doc = null;
  try {
    doc = await getDocumentById(params.id);
  } catch {
    doc = null;
  }
  if (!doc) notFound();
  if (!canAccessDocumentStatus(user.role, doc.status)) notFound();
  let history: Awaited<ReturnType<typeof listDocumentHistory>>;
  try {
    history = await listDocumentHistory(doc.id);
  } catch {
    history = {
      versions: [],
      comments: [],
      audits: [],
    };
  }
  const canManageDocument = canEditDocument(user.role);
  const readableFilePath = doc.previewFilePath ?? doc.mainFilePath;
  let fileUrl: string | null = null;
  if (readableFilePath) {
    try {
      fileUrl = await getDocumentFileSignedUrl(readableFilePath);
    } catch {
      fileUrl = null;
    }
  }
  const readableFilename = readableFilePath?.split("/").pop() ?? doc.title;
  const versions = await Promise.all(
    history.versions.map(async (item) => {
      let versionFileUrl: string | null = null;
      try {
        versionFileUrl = await getDocumentFileSignedUrl(item.filePath);
      } catch {
        versionFileUrl = null;
      }

      return {
        ...item,
        fileUrl: versionFileUrl,
        filename: item.filePath.split("/").pop() ?? `v${item.versionNumber}`,
      };
    }),
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
            <DocumentStatusBadge status={doc.status} locale={locale} />
            <Badge>{doc.currentVersion > 0 ? `v${doc.currentVersion}` : "-"}</Badge>
            {canManageDocument && (
              <Button asChild variant="outline">
                <Link href={`/documents/${doc.id}/edit?mode=update`}>{dictionary.documents.detail.edit}</Link>
              </Button>
            )}
            {canManageDocument && (
              <DocumentDeleteButton documentId={doc.id} documentTitle={doc.title} locale={locale} />
            )}
          </div>
          {canManageDocument && (
            <DocumentWorkflowActions
              documentId={doc.id}
              currentStatus={doc.status}
              locale={locale}
            />
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{dictionary.documents.detail.metadataTitle}</CardTitle>
          <CardDescription>{dictionary.documents.detail.metadataDescription}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-slate-300 md:grid-cols-2">
          <p>{dictionary.documents.detail.fields.department}: {doc.department}</p>
          <p>{dictionary.documents.detail.fields.category}: {doc.categoryId ? getCategoryNameById(doc.categoryId) : dictionary.documents.detail.fields.noCategory}</p>
          <p>{dictionary.documents.detail.fields.type}: {doc.documentType}</p>
          <p>{dictionary.documents.detail.fields.available}: {doc.status === "published" ? dictionary.documents.detail.fields.yes : dictionary.documents.detail.fields.no}</p>
          <p>{dictionary.documents.detail.fields.updatedAt}: {new Date(doc.updatedAt).toLocaleString(locale)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{dictionary.documents.detail.readerTitle}</CardTitle>
          <CardDescription>{dictionary.documents.detail.readerDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {doc.documentType === "document" && (
            <DocumentProcessingPanel
              documentId={doc.id}
              fileType={doc.documentType}
              searchStatus={doc.searchStatus}
              searchError={doc.searchError}
              canRetry={
                canManageDocument &&
                (doc.previewStatus === "failed" || doc.searchStatus === "failed")
              }
              locale={locale}
            />
          )}
          {fileUrl ? (
            <DocumentFileViewer
              fileUrl={fileUrl}
              filename={readableFilename}
              fileType={doc.documentType}
              locale={locale}
            />
          ) : (
            <div className="rounded-lg border border-dashed border-slate-700 p-6 text-sm text-slate-400">
              {dictionary.documents.detail.noMainFile}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="versions">
        <TabsList>
          <TabsTrigger value="versions">{dictionary.documents.detail.tabs.versions}</TabsTrigger>
          <TabsTrigger value="comments">{dictionary.documents.detail.tabs.comments}</TabsTrigger>
          <TabsTrigger value="audit">{dictionary.documents.detail.tabs.audit}</TabsTrigger>
        </TabsList>
        <TabsContent value="versions" className="mt-3">
          <Card>
            <CardContent className="space-y-2 pt-5 text-sm">
              <DocumentVersionsPanel
                documentId={doc.id}
                versions={versions}
                canDelete={canManageDocument}
                currentVersion={doc.currentVersion}
                locale={locale}
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
                locale={locale}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="audit" className="mt-3">
          <Card>
            <CardContent className="space-y-2 pt-5 text-sm">
              {history.audits.length === 0 && <p className="text-slate-400">{dictionary.documents.detail.noAudit}</p>}
              {history.audits.map((item) => (
                <p key={item.id} className="rounded border border-slate-700 p-3">
                  {new Date(item.at).toLocaleString(locale)} - {formatAuditEvent(item)}
                </p>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
