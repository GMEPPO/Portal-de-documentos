import Link from "next/link";
import { DocumentsFilters } from "@/components/documents/documents-filters";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";
import { requireAuth } from "@/lib/auth";
import { departmentOptions, mockCategories } from "@/lib/constants";
import { searchDocumentsByQuery } from "@/lib/document-search";
import { listDocuments } from "@/lib/documents-service";
import { canAccessDocumentStatus, documentStatusLabels } from "@/lib/rbac";
import type { DocumentStatus } from "@/lib/types";
import type { ReactNode } from "react";

function normalizeValue(value: string) {
  return value.trim().toLowerCase();
}

function normalizeForHighlight(text: string) {
  let normalized = "";
  const indexMap: number[] = [];

  for (let index = 0; index < text.length; index += 1) {
    const folded = text[index]
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    for (const char of folded) {
      normalized += char;
      indexMap.push(index);
    }
  }

  return { normalized, indexMap };
}

function highlightSnippet(snippet: string, query: string) {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return snippet;
  }

  const { normalized, indexMap } = normalizeForHighlight(snippet);
  const normalizedQuery = normalizeForHighlight(trimmedQuery).normalized;
  if (!normalizedQuery) {
    return snippet;
  }

  const ranges: Array<{ start: number; end: number }> = [];
  let searchFrom = 0;

  while (searchFrom < normalized.length) {
    const matchIndex = normalized.indexOf(normalizedQuery, searchFrom);
    if (matchIndex === -1) {
      break;
    }

    const start = indexMap[matchIndex];
    const end = (indexMap[matchIndex + normalizedQuery.length - 1] ?? start) + 1;

    if (start !== undefined) {
      ranges.push({ start, end });
    }

    searchFrom = matchIndex + normalizedQuery.length;
  }

  if (ranges.length === 0) {
    return snippet;
  }

  const nodes: ReactNode[] = [];
  let lastIndex = 0;

  ranges.forEach((range, index) => {
    if (range.start > lastIndex) {
      nodes.push(snippet.slice(lastIndex, range.start));
    }

    nodes.push(
      <mark
        key={`match-${range.start}-${range.end}-${index}`}
        className="rounded bg-amber-300/25 px-1 text-amber-100 ring-1 ring-amber-300/35"
      >
        {snippet.slice(range.start, range.end)}
      </mark>,
    );

    lastIndex = range.end;
  });

  if (lastIndex < snippet.length) {
    nodes.push(snippet.slice(lastIndex));
  }

  return nodes;
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
    ? (await searchDocumentsByQuery(query, user, filteredDocuments)).filter((result) => {
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
    query.length > 0;

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
        <CardContent>
          <DocumentsFilters
            initialQuery={query}
            initialStatus={selectedStatus}
            initialCategory={selectedCategory}
            initialDepartment={selectedDepartment}
            statuses={statusOptions.map((status) => ({
              value: status,
              label: documentStatusLabels[status],
            }))}
            categories={mockCategories.map((category) => ({
              value: category.id,
              label: category.name,
            }))}
            departments={departmentOptions.map((department) => ({
              value: department,
              label: department,
            }))}
          />
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
                    <div className="space-y-2">
                      {result.snippets.map((snippet, index) => (
                        <p key={`${result.document.id}-${index}`} className="text-sm text-slate-300">
                          {highlightSnippet(snippet, query)}
                        </p>
                      ))}
                    </div>
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
