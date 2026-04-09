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

type NormalizedText = {
  normalized: string;
  indexMap: number[];
};

function normalizeForSearch(text: string): string {
  return buildNormalizedText(text).normalized;
}

function buildNormalizedText(text: string): NormalizedText {
  let normalized = "";
  const indexMap: number[] = [];

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const folded = char
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    for (const foldedChar of folded) {
      normalized += foldedChar;
      indexMap.push(index);
    }
  }

  return { normalized, indexMap };
}

function sanitizeSnippetText(text: string) {
  return text
    .replace(/\u0000/g, " ")
    .replace(/\uFFFD/g, " ")
    .replace(/[•●▪◦]/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function moveToWordBoundaryStart(text: string, index: number) {
  let cursor = Math.max(0, index);
  while (cursor > 0 && /\S/.test(text[cursor - 1] ?? "")) {
    cursor -= 1;
  }
  return cursor;
}

function moveToWordBoundaryEnd(text: string, index: number) {
  let cursor = Math.min(text.length, index);
  while (cursor < text.length && /\S/.test(text[cursor] ?? "")) {
    cursor += 1;
  }
  return cursor;
}

function buildSnippetFromRange(
  text: string,
  startIndex: number,
  endIndex: number,
  options?: { contextBefore?: number; contextAfter?: number },
) {
  const sanitizedText = sanitizeSnippetText(text);
  if (!sanitizedText) {
    return "";
  }

  const contextBefore = options?.contextBefore ?? 120;
  const contextAfter = options?.contextAfter ?? 160;
  const rawStart = Math.max(0, startIndex - contextBefore);
  const rawEnd = Math.min(sanitizedText.length, endIndex + contextAfter);
  const start = moveToWordBoundaryStart(sanitizedText, rawStart);
  const end = moveToWordBoundaryEnd(sanitizedText, rawEnd);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < sanitizedText.length ? "..." : "";
  return `${prefix}${sanitizedText.slice(start, end).trim()}${suffix}`;
}

type MatchRange = {
  start: number;
  end: number;
};

function extractMatchRanges(text: string, query: string) {
  const sanitizedText = sanitizeSnippetText(text);
  const trimmedQuery = query.trim();
  if (!sanitizedText || !trimmedQuery) {
    return [];
  }

  const { normalized, indexMap } = buildNormalizedText(sanitizedText);
  const normalizedQuery = normalizeForSearch(trimmedQuery);
  if (!normalizedQuery) {
    return [];
  }

  const ranges: MatchRange[] = [];
  let searchFrom = 0;

  while (searchFrom < normalized.length) {
    const matchIndex = normalized.indexOf(normalizedQuery, searchFrom);
    if (matchIndex === -1) {
      break;
    }

    const start = indexMap[matchIndex];
    const lastNormalizedIndex = matchIndex + normalizedQuery.length - 1;
    const end = (indexMap[lastNormalizedIndex] ?? start) + 1;

    if (start !== undefined) {
      ranges.push({ start, end });
    }

    searchFrom = matchIndex + normalizedQuery.length;
  }

  return ranges;
}

function mergeNearbyRanges(ranges: MatchRange[], gap = 80) {
  if (ranges.length === 0) {
    return [];
  }

  const merged: MatchRange[] = [];
  const sortedRanges = [...ranges].sort((left, right) => left.start - right.start);
  let current = { ...sortedRanges[0] };

  for (let index = 1; index < sortedRanges.length; index += 1) {
    const candidate = sortedRanges[index];
    if (candidate.start <= current.end + gap) {
      current.end = Math.max(current.end, candidate.end);
      continue;
    }

    merged.push(current);
    current = { ...candidate };
  }

  merged.push(current);
  return merged;
}

function dedupeSnippets(snippets: string[]) {
  const seen = new Set<string>();
  const deduped: string[] = [];

  for (const snippet of snippets) {
    const key = normalizeForSearch(snippet).replace(/\s+/g, " ").trim();
    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(snippet);
  }

  return deduped;
}

function extractMatchingSnippets(text: string, query: string, limit = 4) {
  const sanitizedText = sanitizeSnippetText(text);
  const ranges = mergeNearbyRanges(extractMatchRanges(sanitizedText, query));

  if (ranges.length === 0) {
    return [];
  }

  const snippets = ranges.map((range) =>
    buildSnippetFromRange(sanitizedText, range.start, range.end),
  );

  return dedupeSnippets(snippets).slice(0, limit);
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
        const titleSnippetSource =
          summary && normalizeForSearch(summary).includes(normalizedQuery) ? summary : title;

        return {
          document,
          snippets: extractMatchingSnippets(titleSnippetSource, trimmedQuery, 1),
          matchedIn: "title" as const,
        };
      }

      const searchableSummary = `${summary} ${category}`.trim();
      if (normalizeForSearch(searchableSummary).includes(normalizedQuery)) {
        return {
          document,
          snippets: extractMatchingSnippets(searchableSummary, trimmedQuery, 1),
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
