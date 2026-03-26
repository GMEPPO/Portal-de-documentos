import Link from "next/link";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";
import { listDocuments } from "@/lib/documents-service";

export default async function DocumentsPage() {
  const documents = await listDocuments();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Documentos</h1>
          <p className="text-slate-400">Pesquisa, filtros e operacao documental.</p>
        </div>
        <Button asChild>
          <Link href="/documents/new">Novo documento</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <Input placeholder="Pesquisar titulo..." />
          <Input placeholder="Estado" />
          <Input placeholder="Categoria" />
          <Input placeholder="Departamento" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-5">
          <Table>
            <THead>
              <tr>
                <TH>Titulo</TH>
                <TH>Departamento</TH>
                <TH>Versao</TH>
                <TH>Estado</TH>
                <TH />
              </tr>
            </THead>
            <TBody>
              {documents.length === 0 && (
                <tr>
                  <TD colSpan={5} className="py-8 text-center text-slate-400">
                    Sem documentos registados.
                  </TD>
                </tr>
              )}
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <TD>{doc.title}</TD>
                  <TD>{doc.department}</TD>
                  <TD>{doc.currentVersion > 0 ? `v${doc.currentVersion}` : "-"}</TD>
                  <TD>
                    <DocumentStatusBadge status={doc.status} />
                  </TD>
                  <TD className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/documents/${doc.id}`}>Ver detalhe</Link>
                    </Button>
                  </TD>
                </tr>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
