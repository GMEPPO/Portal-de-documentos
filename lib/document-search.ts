import { inflateRawSync, inflateSync } from "zlib";
import { getCategoryNameById } from "@/lib/constants";
import { listDocuments } from "@/lib/documents-service";
import { canAccessDocumentStatus } from "@/lib/rbac";
import { downloadDocumentFile } from "@/lib/storage-service";
import type { AppUser, DocumentRecord } from "@/lib/types";

type SearchResult = {
  document: DocumentRecord;
  snippet: string;
  matchedIn: "title" | "summary" | "content";
};

function isPdfPath(path?: string | null) {
  return Boolean(path && path.toLowerCase().endsWith(".pdf"));
}

function decodePdfTextLiteral(input: string) {
  let output = "";

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (char !== "\\") {
      output += char;
      continue;
    }

    const next = input[index + 1];
    if (!next) break;

    if (next >= "0" && next <= "7") {
      let octal = next;
      let offset = 2;
      while (offset <= 3) {
        const candidate = input[index + offset];
        if (candidate && candidate >= "0" && candidate <= "7") {
          octal += candidate;
          offset += 1;
        } else {
          break;
        }
      }
      output += String.fromCharCode(parseInt(octal, 8));
      index += octal.length;
      continue;
    }

    switch (next) {
      case "n":
        output += "\n";
        break;
      case "r":
        output += "\r";
        break;
      case "t":
        output += "\t";
        break;
      case "b":
        output += "\b";
        break;
      case "f":
        output += "\f";
        break;
      default:
        output += next;
        break;
    }
    index += 1;
  }

  return output;
}

function extractLiteralStrings(content: string) {
  const strings: string[] = [];
  let current = "";
  let depth = 0;
  let escaped = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];

    if (depth === 0) {
      if (char === "(") {
        depth = 1;
        current = "";
      }
      continue;
    }

    if (escaped) {
      current += `\\${char}`;
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === "(") {
      depth += 1;
      current += char;
      continue;
    }

    if (char === ")") {
      depth -= 1;
      if (depth === 0) {
        strings.push(decodePdfTextLiteral(current));
        current = "";
      } else {
        current += char;
      }
      continue;
    }

    current += char;
  }

  return strings;
}

function inflatePdfStream(streamBuffer: Buffer) {
  try {
    return inflateSync(streamBuffer).toString("latin1");
  } catch {
    try {
      return inflateRawSync(streamBuffer).toString("latin1");
    } catch {
      return streamBuffer.toString("latin1");
    }
  }
}

function extractTextFromPdfBuffer(buffer: Buffer) {
  const pdf = buffer.toString("latin1");
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  const chunks: string[] = [];

  for (const match of pdf.matchAll(streamRegex)) {
    const rawStream = match[1];
    if (!rawStream) continue;

    const streamBuffer = Buffer.from(rawStream, "latin1");
    const decoded = inflatePdfStream(streamBuffer);
    const strings = extractLiteralStrings(decoded)
      .map((item) => item.replace(/\s+/g, " ").trim())
      .filter(Boolean);

    if (strings.length > 0) {
      chunks.push(strings.join(" "));
    }
  }

  return chunks.join("\n").replace(/\s+/g, " ").trim();
}

function buildSnippet(text: string, query: string) {
  const normalizedText = text.toLowerCase();
  const normalizedQuery = query.toLowerCase();
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

async function getPublishedSearchText(document: DocumentRecord) {
  const pdfPath = isPdfPath(document.previewFilePath)
    ? document.previewFilePath
    : isPdfPath(document.mainFilePath)
      ? document.mainFilePath
      : null;

  if (!pdfPath) {
    return "";
  }

  try {
    const buffer = await downloadDocumentFile(pdfPath);
    if (!buffer) return "";
    return extractTextFromPdfBuffer(buffer);
  } catch {
    return "";
  }
}

export async function searchDocumentsByQuery(query: string, user: AppUser) {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return [];
  }

  const documents = (await listDocuments()).filter((document) =>
    canAccessDocumentStatus(user.role, document.status),
  );

  const publishedDocuments = documents.filter((document) => document.status === "published");

  const matches = await Promise.all(
    publishedDocuments.map(async (document) => {
      const title = document.title ?? "";
      const summary = document.summary ?? "";
      const category = document.categoryId ? getCategoryNameById(document.categoryId) : "";

      if (title.toLowerCase().includes(trimmedQuery.toLowerCase())) {
        return {
          document,
          snippet: buildSnippet(summary || title, trimmedQuery),
          matchedIn: "title" as const,
        };
      }

      const searchableSummary = `${summary} ${category}`.trim();
      if (searchableSummary.toLowerCase().includes(trimmedQuery.toLowerCase())) {
        return {
          document,
          snippet: buildSnippet(searchableSummary, trimmedQuery),
          matchedIn: "summary" as const,
        };
      }

      const extractedText = await getPublishedSearchText(document);
      if (extractedText.toLowerCase().includes(trimmedQuery.toLowerCase())) {
        return {
          document,
          snippet: buildSnippet(extractedText, trimmedQuery),
          matchedIn: "content" as const,
        };
      }

      return null;
    }),
  );

  return matches.filter((item): item is SearchResult => item !== null);
}
