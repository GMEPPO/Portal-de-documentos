import Link from "next/link";
import { DocumentsFilters } from "@/components/documents/documents-filters";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";
import { requireAuth } from "@/lib/auth";
import { getDictionary } from "@/lib/dictionary";
import { getLocale } from "@/lib/i18n";
import { getDocumentStatusLabels } from "@/lib/i18n-shared";
import { departmentOptions, getCategoryNameById, mockCategories } from "@/lib/constants";
import { searchDocumentsByQuery } from "@/lib/document-search";
import { listDocuments } from "@/lib/documents-service";
import { canAccessDocumentStatus } from "@/lib/rbac";
import type { DocumentStatus } from "@/lib/types";
import type { ReactNode } from "react";
import { createSupabaseServerClient } from "@/lib/supabase-server";

async function loadAvailableTags() {
  const supabase = createSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("document_tags").select("name").order("name", { ascending: true });
  if (error) return [];
  return (data ?? []).map((r: any) => r.name).filter(Boolean);
}

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
    tag?: string | string[];
  };
}) {
  const user = await requireAuth();
  const locale = getLocale();
  const dictionary = getDictionary(locale);
  const statusLabels = getDocumentStatusLabels(locale);
  const query = searchParams?.q?.trim() ?? "";
  const selectedStatus = searchParams?.status?.trim() ?? "";
  const selectedCategory = searchParams?.category?.trim() ?? "";
  const selectedDepartment = searchParams?.department?.trim() ?? "";
  const rawTag = searchParams?.tag;
  const selectedTags = (Array.isArray(rawTag) ? rawTag.join(",") : rawTag ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const availableTags = await loadAvailableTags();

  const documents = (await listDocuments()).filter((doc) =>
    canAccessDocumentStatus(user.role, doc.status),
  );
  const filteredDocuments = documents.filter((doc) => {
    const statusMatches = !selectedStatus || doc.status === selectedStatus;
    const categoryMatches = !selectedCategory || doc.categoryId === selectedCategory;
    const departmentMatches =
      !selectedDepartment ||
      normalizeValue(doc.department) === normalizeValue(selectedDepartment);
    const docTags = (doc.tags ?? []).map(normalizeValue);
    const tagMatches =
      selectedTags.length === 0 || selectedTags.every((st) => docTags.includes(normalizeValue(st)));

    return statusMatches && categoryMatches && departmentMatches && tagMatches;
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
        const docTags = (result.document.tags ?? []).map(normalizeValue);
        const tagMatches =
          selectedTags.length === 0 || selectedTags.every((st) => docTags.includes(normalizeValue(st)));

        return statusMatches && categoryMatches && departmentMatches && tagMatches;
      })
    : [];

  const showingSearchResults =
    query.length > 0;

  const statusOptions: DocumentStatus[] = ["in_review", "updating", "published"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{dictionary.documents.pageTitle}</h1>
          <p className="text-slate-400">{dictionary.documents.pageDescription}</p>
        </div>
        <Button asChild>
          <Link href="/documents/new">{dictionary.documents.newButton}</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{dictionary.documents.filtersTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentsFilters
            initialQuery={query}
            initialStatus={selectedStatus}
            initialCategory={selectedCategory}
            initialDepartment={selectedDepartment}
            initialTags={selectedTags}
            statuses={statusOptions.map((status) => ({
              value: status,
              label: statusLabels[status],
            }))}
            categories={mockCategories.map((category) => ({
              value: category.id,
              label: category.name,
            }))}
            departments={departmentOptions.map((department) => ({
              value: department,
              label: department,
            }))}
            tags={availableTags.map((t) => ({ value: t, label: t }))}
            labels={dictionary.documents.filters}
          />
        </CardContent>
      </Card>

      {showingSearchResults ? (
        <Card>
          <CardHeader>
            <CardTitle>{dictionary.documents.resultsTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {searchResults.length === 0 && (
              <p className="text-sm text-slate-400">{dictionary.documents.noResults}</p>
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
                      <DocumentStatusBadge status={result.document.status} locale={locale} />
                    </div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      {result.matchedIn === "content"
                        ? dictionary.documents.match.content
                        : result.matchedIn === "summary"
                          ? dictionary.documents.match.summary
                          : dictionary.documents.match.title}
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
                      <Link href={`/documents/${result.document.id}`}>{dictionary.documents.viewDetail}</Link>
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
                  <TH>{dictionary.documents.table.title}</TH>
                  <TH>{dictionary.documents.table.department}</TH>
                  <TH>{dictionary.documents.table.category}</TH>
                  <TH>{dictionary.documents.table.version}</TH>
                  <TH>{dictionary.documents.table.status}</TH>
                </tr>
              </THead>
              <TBody>
                {documents.length === 0 && (
                  <tr>
                    <TD colSpan={5} className="py-8 text-center text-slate-400">
                      {dictionary.documents.table.empty}
                    </TD>
                  </tr>
                )}
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id}>
                    <TD>
                      <Link href={`/documents/${doc.id}`} className="hover:underline">
                        {doc.title}
                      </Link>
                    </TD>
                    <TD>{doc.department}</TD>
                    <TD>{getCategoryNameById(doc.categoryId)}</TD>
                    <TD>{doc.currentVersion > 0 ? `v${doc.currentVersion}` : "-"}</TD>
                    <TD>
                      <DocumentStatusBadge status={doc.status} locale={locale} />
                    </TD>
                  </tr>
                ))}
                {filteredDocuments.length === 0 && documents.length > 0 && (
                  <tr>
                    <TD colSpan={5} className="py-8 text-center text-slate-400">
                      {dictionary.documents.table.filteredEmpty}
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
