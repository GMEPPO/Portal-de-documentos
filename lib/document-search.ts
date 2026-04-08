import { getCategoryNameById } from "@/lib/constants";
import { createSupabaseServiceServerClient } from "@/lib/supabase-service-server";
import { listDocuments } from "@/lib/documents-service";
import { canAccessDocumentStatus } from "@/lib/rbac";
import type { AppUser, DocumentRecord } from "@/lib/types";

type SearchResult = {
  document: DocumentRecord;
  snippet: string;
  matchedIn: "title" | "summary" | "content";
};

function normalizeForSearch(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function buildSnippet(text: string, query: string) {
  const normalizedText = normalizeForSearch(text);
  const normalizedQuery = normalizeForSearch(query);
  const matchIndex = normalizedText.indexOf(normalizedQuery);

  if (matchIndex === -1) {
    return text.slice(0, 220).trim();
  }

  const start = Math.max(0, matchIndex - 120);
  const end = Math.min(text.length, matchIndex + query.length + 120);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < text.length ? "..." : "";
  return `${prefix}${text.slice(start, end).trim()}${suffix}`;
}

async function loadChunkTextByDocumentId(documentIds: string[]) {
  if (documentIds.length === 0) {
    return new Map<string, string>();
  }

  const supabase = createSupabaseServiceServerClient();
  if (!supabase) {
    return new Map<string, string>();
  }

  const { data, error } = await supabase
    .from("document_chunks")
    .select("document_id, chunk_index, content, page_content")
    .in("document_id", documentIds)
    .order("document_id", { ascending: true })
    .order("chunk_index", { ascending: true });

  if (error) {
    console.warn("[document-search] failed to load chunks", {
      message: error.message,
      documentIds,
    });
    return new Map<string, string>();
  }

  const grouped = new Map<string, string[]>();
  for (const row of data ?? []) {
    const documentId = row.document_id as string | null;
    if (!documentId) continue;

    const text = String(row.content ?? row.page_content ?? "").trim();
    if (!text) continue;

    const current = grouped.get(documentId) ?? [];
    current.push(text);
    grouped.set(documentId, current);
  }

  return new Map(
    Array.from(grouped.entries()).map(([documentId, chunks]) => [
      documentId,
      chunks.join("\n\n"),
    ]),
  );
}

export async function searchDocumentsByQuery(
  query: string,
  user: AppUser,
  sourceDocuments?: DocumentRecord[],
) {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return [];
  }

  const documents = sourceDocuments
    ? sourceDocuments
    : (await listDocuments()).filter((document) =>
        canAccessDocumentStatus(user.role, document.status),
      );

  const publishedDocuments = documents.filter((document) => document.status === "published");
  const normalizedQuery = normalizeForSearch(trimmedQuery);
  const chunkTextByDocumentId = await loadChunkTextByDocumentId(
    publishedDocuments.map((document) => document.id),
  );

  const matches = await Promise.all(
    publishedDocuments.map(async (document) => {
      const title = document.title ?? "";
      const summary = document.summary ?? "";
      const category = document.categoryId ? getCategoryNameById(document.categoryId) : "";

      if (normalizeForSearch(title).includes(normalizedQuery)) {
        return {
          document,
          snippet: buildSnippet(summary || title, trimmedQuery),
          matchedIn: "title" as const,
        };
      }

      const searchableSummary = `${summary} ${category}`.trim();
      if (normalizeForSearch(searchableSummary).includes(normalizedQuery)) {
        return {
          document,
          snippet: buildSnippet(searchableSummary, trimmedQuery),
          matchedIn: "summary" as const,
        };
      }

      const indexedSearchText = document.searchText?.trim() ?? "";
      if (indexedSearchText && normalizeForSearch(indexedSearchText).includes(normalizedQuery)) {
        return {
          document,
          snippet: buildSnippet(indexedSearchText, trimmedQuery),
          matchedIn: "content" as const,
        };
      }

      const chunkText = chunkTextByDocumentId.get(document.id)?.trim() ?? "";
      if (chunkText && normalizeForSearch(chunkText).includes(normalizedQuery)) {
        return {
          document,
          snippet: buildSnippet(chunkText, trimmedQuery),
          matchedIn: "content" as const,
        };
      }

      return null;
    }),
  );

  return matches.filter((item): item is SearchResult => item !== null);
}
