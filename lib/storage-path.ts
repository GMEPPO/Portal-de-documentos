import { createHash } from "crypto";

function getExtension(filename: string) {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1) return "";
  // Incluye el punto: ".pdf"
  return filename.slice(lastDot);
}

function shortHash(input: string) {
  return createHash("sha256").update(input).digest("hex").slice(0, 16);
}

export function getMainFileObjectPath(
  documentId: string,
  originalFilename: string,
) {
  const ext = getExtension(originalFilename);
  const hash = shortHash(originalFilename);
  const safeFilename = `${documentId}-main-${hash}${ext}`;
  return `${documentId}/main/${safeFilename}`;
}

export function getVersionFileObjectPath(
  documentId: string,
  versionId: string,
  originalFilename: string,
  sortOrder: number,
) {
  const ext = getExtension(originalFilename);
  const hash = shortHash(`${versionId}-${sortOrder}-${originalFilename}`);
  const safeFilename = `file-${sortOrder}-${hash}${ext}`;
  return `${documentId}/v/${versionId}/${safeFilename}`;
}

export function getPreviewFileObjectPath(
  documentId: string,
  originalFilename: string,
) {
  const hash = shortHash(originalFilename);
  const safeFilename = `${documentId}-preview-${hash}.pdf`;
  return `${documentId}/preview/${safeFilename}`;
}

