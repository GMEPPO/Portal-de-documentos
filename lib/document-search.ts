import { getCategoryNameById } from "@/lib/constants";
import { createSupabaseServiceServerClient } from "@/lib/supabase-service-server";
import { listDocuments } from "@/lib/documents-service";
import { canAccessDocumentStatus } from "@/lib/rbac";
import type { AppUser, DocumentRecord } from "@/lib/types";

type SearchResult = {
  document: DocumentRecord;
  snippets: string[];
  matchedIn: "title" | "summary" | "content";
};

function normalizeForSearch(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function sanitizeSnippetText(text: string) {
  return text
    .replace(/\u0000/g, " ")
    .replace(/\uFFFD/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
}

function buildSnippet(text: string, query: string) {
  const normalizedQuery = normalizeForSearch(query);
  const sanitizedText = sanitizeSnippetText(text);
  const paragraphs = sanitizedText
    .split(/\n{2,}|(?<=[.!?])\s{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const bestParagraph =
    paragraphs.find((paragraph) =>
      normalizeForSearch(paragraph).includes(normalizedQuery),
    ) ?? sanitizedText;

  const normalizedText = normalizeForSearch(bestParagraph);
  const matchIndex = normalizedText.indexOf(normalizedQuery);

  if (matchIndex === -1) {
    return bestParagraph.slice(0, 220).trim();
  }

  const snippetWindow = 180;
  const start = Math.max(0, matchIndex - 120);
  const end = Math.min(bestParagraph.length, matchIndex + query.length + snippetWindow);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < bestParagraph.length ? "..." : "";
  return `${prefix}${bestParagraph.slice(start, end).trim()}${suffix}`;
}

function extractMatchingSnippets(text: string, query: string, limit = 3) {
  const normalizedQuery = normalizeForSearch(query);
  const sanitizedText = sanitizeSnippetText(text);
  const paragraphs = sanitizedText
    .split(/\n{2,}|(?<=[.!?])\s{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const matches = paragraphs
    .filter((paragraph) => normalizeForSearch(paragraph).includes(normalizedQuery))
    .map((paragraph) => buildSnippet(paragraph, query));

  if (matches.length > 0) {
    return matches.slice(0, limit);
  }

  return sanitizedText ? [buildSnippet(sanitizedText, query)] : [];
}

async function loadChunkTextByDocumentId(documentIds: string[]) {
  if (documentIds.length === 0) {
    return new Map<string, string[]>();
  }

  const supabase = createSupabaseServiceServerClient();
  if (!supabase) {
    return new Map<string, string[]>();
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
    return new Map<string, string[]>();
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

  return grouped;
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

  const searchableDocuments = documents.filter((document) => document.status === "published");
  const normalizedQuery = normalizeForSearch(trimmedQuery);
  const chunkTextByDocumentId = await loadChunkTextByDocumentId(
    searchableDocuments.map((document) => document.id),
  );

  const matches = await Promise.all(
    searchableDocuments.map(async (document) => {
      const title = document.title ?? "";
      const summary = document.summary ?? "";
      const category = document.categoryId ? getCategoryNameById(document.categoryId) : "";

      if (normalizeForSearch(title).includes(normalizedQuery)) {
        return {
          document,
          snippets: [buildSnippet(summary || title, trimmedQuery)],
          matchedIn: "title" as const,
        };
      }

      const searchableSummary = `${summary} ${category}`.trim();
      if (normalizeForSearch(searchableSummary).includes(normalizedQuery)) {
        return {
          document,
          snippets: [buildSnippet(searchableSummary, trimmedQuery)],
          matchedIn: "summary" as const,
        };
      }

      const indexedSearchText = document.searchText?.trim() ?? "";
      if (indexedSearchText && normalizeForSearch(indexedSearchText).includes(normalizedQuery)) {
        return {
          document,
          snippets: extractMatchingSnippets(indexedSearchText, trimmedQuery, 3),
          matchedIn: "content" as const,
        };
      }

      const chunkTexts = chunkTextByDocumentId.get(document.id) ?? [];
      const snippets = chunkTexts.flatMap((chunkText) =>
        extractMatchingSnippets(chunkText, trimmedQuery, 2),
      );

      if (snippets.length > 0) {
        return {
          document,
          snippets: snippets.slice(0, 4),
          matchedIn: "content" as const,
        };
      }

      return null;
    }),
  );

  return matches.filter((item): item is SearchResult => item !== null);
}
