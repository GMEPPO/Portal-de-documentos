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

// Storage keys: para evitar errores por caracteres/espacios raros, generamos un nombre seguro en ASCII.
// Si luego quieres mostrar el nombre original, se guarda en metadatos (futuro).
export function getMainFileObjectPath(
  documentId: string,
  originalFilename: string,
) {
  const ext = getExtension(originalFilename);
  const hash = shortHash(originalFilename);
  const safeFilename = `${documentId}-main-${hash}${ext}`;
  return `${documentId}/main/${safeFilename}`;
}

export function getPreviewFileObjectPath(
  documentId: string,
  originalFilename: string,
) {
  const hash = shortHash(originalFilename);
  const safeFilename = `${documentId}-preview-${hash}.pdf`;
  return `${documentId}/preview/${safeFilename}`;
}

