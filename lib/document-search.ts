import { getCategoryNameById } from "@/lib/constants";
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

      return null;
    }),
  );

  return matches.filter((item): item is SearchResult => item !== null);
}
