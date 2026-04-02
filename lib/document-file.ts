import type { DocumentFileType } from "@/lib/types";

const EXTENSION_TO_TYPE: Record<string, DocumentFileType> = {
  ".pdf": "document",
  ".doc": "document",
  ".docx": "document",
  ".mp4": "video",
  ".mp3": "audio",
};

export const ACCEPTED_DOCUMENT_EXTENSIONS = Object.keys(EXTENSION_TO_TYPE);
export const ACCEPTED_DOCUMENT_FILE_INPUT = ACCEPTED_DOCUMENT_EXTENSIONS.join(",");

export function getExtension(filename: string) {
  const normalized = filename.trim().toLowerCase();
  const index = normalized.lastIndexOf(".");
  return index >= 0 ? normalized.slice(index) : "";
}

export function isPdfFilename(filename: string) {
  return getExtension(filename) === ".pdf";
}

export function isWordFilename(filename: string) {
  const extension = getExtension(filename);
  return extension === ".doc" || extension === ".docx";
}

export function getDocumentFileType(filename: string): DocumentFileType | null {
  return EXTENSION_TO_TYPE[getExtension(filename)] ?? null;
}

export function isSupportedDocumentFile(filename: string) {
  return getDocumentFileType(filename) !== null;
}

export function getDocumentFileTypeLabel(type: DocumentFileType) {
  switch (type) {
    case "document":
      return "Documento";
    case "video":
      return "Video";
    case "audio":
      return "Audio";
  }
}
