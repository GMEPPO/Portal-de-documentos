export function sanitizeStorageFilename(filename: string) {
  // Evita que el nombre contenga separadores de ruta y mantenlo “seguro” como segmento.
  const noSlashes = filename.replace(/[\/\\]/g, "_");
  // encodeURIComponent protege caracteres especiales (ç, espacios, etc.) para el path.
  return encodeURIComponent(noSlashes);
}

export function getMainFileObjectPath(documentId: string, originalFilename: string) {
  return `${documentId}/main/${sanitizeStorageFilename(originalFilename)}`;
}

