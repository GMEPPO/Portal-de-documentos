import Link from "next/link";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";
import { requireAuth } from "@/lib/auth";
import { departmentOptions, mockCategories } from "@/lib/constants";
import { searchDocumentsByQuery } from "@/lib/document-search";
import { listDocuments } from "@/lib/documents-service";
import { canAccessDocumentStatus, documentStatusLabels } from "@/lib/rbac";
import type { DocumentStatus } from "@/lib/types";

function normalizeValue(value: string) {
  return value.trim().toLowerCase();
}

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams?: {
    q?: string;
    status?: string;
    category?: string;
    department?: string;
  };
}) {
  const user = await requireAuth();
  const query = searchParams?.q?.trim() ?? "";
  const selectedStatus = searchParams?.status?.trim() ?? "";
  const selectedCategory = searchParams?.category?.trim() ?? "";
  const selectedDepartment = searchParams?.department?.trim() ?? "";

  const documents = (await listDocuments()).filter((doc) =>
    canAccessDocumentStatus(user.role, doc.status),
  );
  const filteredDocuments = documents.filter((doc) => {
    const statusMatches = !selectedStatus || doc.status === selectedStatus;
    const categoryMatches = !selectedCategory || doc.categoryId === selectedCategory;
    const departmentMatches =
      !selectedDepartment ||
      normalizeValue(doc.department) === normalizeValue(selectedDepartment);

    return statusMatches && categoryMatches && departmentMatches;
  });

  const searchResults = query
    ? (await searchDocumentsByQuery(query, user)).filter((result) => {
        const statusMatches =
          !selectedStatus || result.document.status === selectedStatus;
        const categoryMatches =
          !selectedCategory || result.document.categoryId === selectedCategory;
        const departmentMatches =
          !selectedDepartment ||
          normalizeValue(result.document.department) === normalizeValue(selectedDepartment);

        return statusMatches && categoryMatches && departmentMatches;
      })
    : [];

  const showingSearchResults =
    query.length > 0 ||
    selectedStatus.length > 0 ||
    selectedCategory.length > 0 ||
    selectedDepartment.length > 0;

  const statusOptions: DocumentStatus[] = ["in_review", "updating", "published"];

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
          <form className="contents" action="/documents">
            <Input
              name="q"
              defaultValue={query}
              placeholder="Pesquisar titulo ou palavras dentro de documentos publicados..."
            />
            <select
              name="status"
              defaultValue={selectedStatus}
              className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="">Estado</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {documentStatusLabels[status]}
                </option>
              ))}
            </select>
            <select
              name="category"
              defaultValue={selectedCategory}
              className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="">Categoria</option>
              {mockCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select
              name="department"
              defaultValue={selectedDepartment}
              className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="">Departamento</option>
              {departmentOptions.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
            <div className="md:col-span-4 flex flex-col gap-3 md:flex-row">
              <Button type="submit">Pesquisar</Button>
              {showingSearchResults && (
                <Button asChild type="button" variant="outline">
                  <Link href="/documents">Limpar</Link>
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {showingSearchResults ? (
        <Card>
          <CardHeader>
            <CardTitle>Resultados de pesquisa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {searchResults.length === 0 && (
              <p className="text-sm text-slate-400">
                Nao foram encontrados documentos para os filtros aplicados.
              </p>
            )}
            {searchResults.map((result) => (
              <div
                key={result.document.id}
                className="rounded-lg border border-slate-700 bg-slate-900/40 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-medium text-slate-100">
                        {result.document.title}
                      </p>
                      <DocumentStatusBadge status={result.document.status} />
                    </div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      {result.matchedIn === "content"
                        ? "Coincidencia no conteudo"
                        : result.matchedIn === "summary"
                          ? "Coincidencia no resumo"
                          : "Coincidencia no titulo"}
                    </p>
                    <p className="text-sm text-slate-300">{result.snippet}</p>
                  </div>
                  <div className="shrink-0">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/documents/${result.document.id}`}>Ver detalhe</Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
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
                {filteredDocuments.map((doc) => (
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
                {filteredDocuments.length === 0 && documents.length > 0 && (
                  <tr>
                    <TD colSpan={5} className="py-8 text-center text-slate-400">
                      Nao existem documentos para os filtros selecionados.
                    </TD>
                  </tr>
                )}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
