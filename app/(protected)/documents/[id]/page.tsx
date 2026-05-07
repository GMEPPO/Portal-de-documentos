import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentCommentsPanel } from "@/components/documents/document-comments-panel";
import { DocumentDeleteButton } from "@/components/documents/document-delete-button";
import { DocumentReaderSplit } from "@/components/documents/document-reader-split";
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
import { canAccessDocumentStatus, canEditDocument, canManageCommunications } from "@/lib/rbac";
import { getDocumentFileSignedUrl } from "@/lib/storage-service";
import { listCommunicationsForDocument } from "@/lib/communications";
import { listEventsForDocument } from "@/lib/events";
import type { DocumentAuditRecord } from "@/lib/types";

function fileTypeSortWeight(originalName: string, fileType: string): number {
  const n = originalName.toLowerCase();
  if (n.endsWith(".pdf")) return 0;
  if (n.endsWith(".doc") || n.endsWith(".docx")) return 1;
  if (fileType === "video" || /\.(mp4|mov|avi|webm|mkv|m4v)$/.test(n)) return 2;
  if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/.test(n)) return 3;
  if (fileType === "audio" || /\.(mp3|wav|aac|ogg|flac|m4a)$/.test(n)) return 4;
  return 5;
}

function formatAuditEvent(item: DocumentAuditRecord) {
  const versionNumber =
    typeof item.metadata?.versionNumber === "number" ? item.metadata.versionNumber : null;

  if (item.event.startsWith("document.version.deleted:"))
    return versionNumber !== null
      ? `Eliminada a versão V${String(versionNumber).padStart(3, "0")}.`
      : "Eliminada uma versão antiga do documento.";

  if (item.event.startsWith("document.version.patched:"))
    return versionNumber !== null
      ? `Actualizada a versão V${String(versionNumber).padStart(3, "0")} (admin).`
      : "Uma versão foi actualizada pelo administrador.";

  if (item.event.startsWith("document.version:"))
    return versionNumber !== null
      ? `Carregada a versão V${String(versionNumber).padStart(3, "0")}.`
      : "Carregada uma nova versão do documento.";

  if (item.event.startsWith("document.created:")) return "Documento criado.";
  if (item.event.startsWith("document.updated:")) return "Metadados ou estado do documento atualizados.";
  if (item.event.startsWith("document.comment:")) return "Adicionado um comentário ao documento.";
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
    history = { versions: [], comments: [], audits: [] };
  }

  const canManageDocument = canEditDocument(user.role);
  const canComm = canManageCommunications(user.role);

  let docCommunications: Awaited<ReturnType<typeof listCommunicationsForDocument>> = [];
  let docEvents: Awaited<ReturnType<typeof listEventsForDocument>> = [];
  if (canComm) {
    [docCommunications, docEvents] = await Promise.all([
      listCommunicationsForDocument(doc.id).catch(() => []),
      listEventsForDocument(doc.id).catch(() => []),
    ]);
  }

  const versions = await Promise.all(
    history.versions.map(async (item) => {
      const filesWithUrls = await Promise.all(
        (item.files ?? []).map(async (f) => {
          const fileUrl = await getDocumentFileSignedUrl(f.filePath).catch((e: unknown) => {
            console.error("[doc-detail] sign url failed", {
              versionId: item.id,
              versionNumber: item.versionNumber,
              filePath: f.filePath,
              error: e instanceof Error ? e.message : String(e),
            });
            return null;
          });
          return {
            id: f.id,
            fileType: f.fileType,
            filePath: f.filePath,
            originalName: f.originalName,
            sortOrder: f.sortOrder,
            fileUrl,
          };
        }),
      );
      return { ...item, files: filesWithUrls };
    }),
  );

  const currentVersionFiles = (
    versions.find((v) => v.versionNumber === doc.currentVersion)?.files ?? []
  )
    .filter((f) => Boolean(f.fileUrl))
    .sort((a, b) => {
      const wA = fileTypeSortWeight(a.originalName, a.fileType);
      const wB = fileTypeSortWeight(b.originalName, b.fileType);
      if (wA !== wB) return wA - wB;
      return a.sortOrder - b.sortOrder;
    })
    .map((f) => ({
      fileUrl: f.fileUrl as string,
      filename: f.originalName || f.filePath.split("/").pop() || "",
      fileType: f.fileType,
    }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">{doc.title}</h1>
          <p className="text-slate-400">{doc.summary}</p>
          <div className="grid gap-x-6 gap-y-1 text-xs text-slate-400 sm:grid-cols-2 lg:grid-cols-3">
            <p>
              <span className="text-slate-500">{dictionary.documents.detail.fields.department}:</span>{" "}
              <span className="text-slate-300">{doc.department}</span>
            </p>
            <p>
              <span className="text-slate-500">{dictionary.documents.detail.fields.category}:</span>{" "}
              <span className="text-slate-300">
                {doc.categoryId ? getCategoryNameById(doc.categoryId) : dictionary.documents.detail.fields.noCategory}
              </span>
            </p>
            <p>
              <span className="text-slate-500">{dictionary.documents.detail.fields.owner}:</span>{" "}
              <span className="text-slate-300">{doc.ownerName ?? doc.ownerId}</span>
            </p>
            <p>
              <span className="text-slate-500">{dictionary.documents.detail.fields.available}:</span>{" "}
              <span className="text-slate-300">
                {doc.status === "published" ? dictionary.documents.detail.fields.yes : dictionary.documents.detail.fields.no}
              </span>
            </p>
            <p className="sm:col-span-2 lg:col-span-1">
              <span className="text-slate-500">{dictionary.documents.detail.fields.updatedAt}:</span>{" "}
              <span className="text-slate-300">{new Date(doc.updatedAt).toLocaleString(locale)}</span>
            </p>
            {doc.tags?.length ? (
              <div className="sm:col-span-2 lg:col-span-3">
                <div className="flex flex-wrap gap-2 pt-1">
                  {doc.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-slate-700 bg-slate-900/40 px-3 py-1 text-[11px] text-slate-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
            <DocumentStatusBadge status={doc.status} locale={locale} />
            <Badge>{doc.currentVersion > 0 ? `v${doc.currentVersion}` : "-"}</Badge>
            {canManageDocument && (
              <Button asChild variant="outline">
                <Link href={`/documents/${doc.id}/edit`}>{dictionary.documents.detail.edit}</Link>
              </Button>
            )}
            {canManageDocument && (
              <DocumentDeleteButton documentId={doc.id} documentTitle={doc.title} locale={locale} />
            )}
            {canManageDocument && (
              <DocumentWorkflowActions documentId={doc.id} currentStatus={doc.status} locale={locale} />
            )}
            {canComm && (
              <Button asChild variant="outline">
                <Link href={`/documents/${doc.id}/comunicar`}>{dictionary.documents.detail.communicateButton}</Link>
              </Button>
            )}
            {canComm && (
              <Button asChild variant="outline">
                <Link href={`/communications/eventos/new?documentId=${doc.id}`}>{dictionary.documents.detail.newEvent}</Link>
              </Button>
            )}
          </div>
        </div>
      </div>


      <DocumentReaderSplit
        files={currentVersionFiles}
        labels={{
          empty: dictionary.documents.detail.noMainFile,
          listTitle: dictionary.documents.detail.filesTitle,
          listDescription: dictionary.documents.detail.filesDescription,
          open: dictionary.documents.detail.open,
          download: dictionary.documents.detail.download,
          noPreview: dictionary.documents.detail.noPreviewFile,
        }}
      />

      {canComm && docEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{dictionary.documents.detail.relatedEventsHeading}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {docEvents.slice(0, 5).map((ev) => (
              <div key={ev.id} className="flex items-center justify-between rounded border border-slate-700 px-3 py-2 text-sm">
                <span className="text-slate-200">{ev.subject}</span>
                <span className="text-xs text-slate-400">{new Date(ev.startsAt).toLocaleDateString(locale)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {canComm && docCommunications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{dictionary.documents.detail.communicationsHeading}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {docCommunications.slice(0, 5).map((comm) => (
              <div key={comm.id} className="flex items-center justify-between rounded border border-slate-700 px-3 py-2 text-sm">
                <span className="truncate text-slate-200">{comm.subject}</span>
                <span className="text-xs text-slate-400">{new Date(comm.sentAt).toLocaleDateString(locale)}</span>
              </div>
            ))}
            {docCommunications.length > 5 && (
              <p className="pt-1 text-xs text-slate-400">
                <Link href="/communications" className="text-amber-400 hover:underline">
                  {dictionary.documents.detail.viewAllComms}
                </Link>
              </p>
            )}
          </CardContent>
        </Card>
      )}

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
                canEdit={canManageDocument}
                currentVersion={doc.currentVersion}
                locale={locale}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="comments" className="mt-3">
          <Card>
            <CardContent className="space-y-2 pt-5 text-sm">
              <DocumentCommentsPanel documentId={doc.id} comments={history.comments} locale={locale} />
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
