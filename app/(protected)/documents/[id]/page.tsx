import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentFileViewer } from "@/components/documents/document-file-viewer";
import { DocumentStatusActions } from "@/components/documents/document-status-actions";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireAuth } from "@/lib/auth";
import { getDocumentById, listDocumentHistory } from "@/lib/documents-service";
import { canAccessDocumentStatus, getAllowedTransitions } from "@/lib/rbac";
import { getDocumentFileSignedUrl } from "@/lib/storage-service";

export default async function DocumentDetailPage({ params }: { params: { id: string } }) {
  const user = await requireAuth();
  const doc = await getDocumentById(params.id);
  if (!doc) notFound();
  if (!canAccessDocumentStatus(user.role, doc.status)) notFound();
  const history = await listDocumentHistory(doc.id);
  const allowedTransitions = getAllowedTransitions(user.role, doc.status);
  const fileUrl = doc.mainFilePath
    ? await getDocumentFileSignedUrl(doc.mainFilePath)
    : null;
  const mainFilename = doc.mainFilePath?.split("/").pop() ?? doc.title;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{doc.title}</h1>
          <p className="text-slate-400">{doc.summary}</p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 xl:justify-end">
            <DocumentStatusBadge status={doc.status} />
            <Badge>{doc.currentVersion > 0 ? `v${doc.currentVersion}` : "-"}</Badge>
            <Button asChild variant="outline">
              <Link href={`/documents/${doc.id}/edit`}>Editar</Link>
            </Button>
          </div>
          <DocumentStatusActions
            documentId={doc.id}
            currentStatus={doc.status}
            allowedTransitions={allowedTransitions}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Metadados</CardTitle>
          <CardDescription>Informacao estrutural e classificacao.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-slate-300 md:grid-cols-2">
          <p>Departamento: {doc.department}</p>
          <p>Categoria: {doc.categoryId || "Sem categoria"}</p>
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
        <CardContent>
          {fileUrl ? (
            <DocumentFileViewer fileUrl={fileUrl} filename={mainFilename} />
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
              {history.versions.length === 0 && <p className="text-slate-400">Sem versoes extra.</p>}
              {history.versions.map((item) => (
                <p key={item.id} className="rounded border border-slate-700 p-3">
                  v{item.versionNumber} · {item.changelog}
                </p>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="comments" className="mt-3">
          <Card>
            <CardContent className="space-y-2 pt-5 text-sm">
              {history.comments.length === 0 && (
                <p className="text-slate-400">Sem comentarios registados.</p>
              )}
              {history.comments.map((item) => (
                <p key={item.id} className="rounded border border-slate-700 p-3">
                  {item.content}
                </p>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="audit" className="mt-3">
          <Card>
            <CardContent className="space-y-2 pt-5 text-sm">
              {history.audits.length === 0 && <p className="text-slate-400">Sem eventos.</p>}
              {history.audits.map((item) => (
                <p key={item.id} className="rounded border border-slate-700 p-3">
                  {item.event}
                </p>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
