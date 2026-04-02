import type { DocumentFileType, DocumentProcessingStatus } from "@/lib/types";

export const documentProcessingStatusLabels: Record<DocumentProcessingStatus, string> = {
  pending: "Pendente",
  processing: "A processar",
  ready: "Pronto",
  failed: "Falhou",
  skipped: "Nao aplicavel",
};

export function needsDocumentProcessing(fileType: DocumentFileType) {
  return fileType === "document";
}

export function shouldAutoStartDocumentProcessing(
  fileType: DocumentFileType,
  searchStatus: DocumentProcessingStatus,
) {
  if (!needsDocumentProcessing(fileType)) {
    return false;
  }

  return searchStatus === "pending";
}
