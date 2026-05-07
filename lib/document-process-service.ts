import { getDocumentById, listDocumentHistory, updateDocumentProcessingState } from "@/lib/documents-service";
import { isPdfFilename } from "@/lib/document-file";
import { triggerDocumentIndexingWebhooks } from "@/lib/n8n-webhook";
import { downloadDocumentFile } from "@/lib/storage-service";

export async function processDocumentAssets(documentId: string) {
  console.info("[document-process] start", { documentId });
  const document = await getDocumentById(documentId);
  if (!document) {
    throw new Error("Documento não encontrado.");
  }

  if (
    (document.previewStatus === "ready" || document.previewStatus === "skipped") &&
    (document.searchStatus === "ready" || document.searchStatus === "skipped") &&
    !document.previewError &&
    !document.searchError
  ) {
    console.info("[document-process] skipping, already processed", { documentId });
    return document;
  }

  // Obtém ficheiros da versão atual
  let history: Awaited<ReturnType<typeof listDocumentHistory>>;
  try {
    history = await listDocumentHistory(documentId);
  } catch {
    throw new Error("Não foi possível carregar o histórico do documento.");
  }

  const currentVersion = history.versions.find((v) => v.versionNumber === document.currentVersion);
  const primaryFile = currentVersion?.files?.find((f) => f.fileType === "document") ?? currentVersion?.files?.[0];

  if (!primaryFile) {
    console.info("[document-process] no files found", { documentId });
    return updateDocumentProcessingState(documentId, {
      previewStatus: "skipped",
      searchStatus: "skipped",
      previewError: null,
      searchError: null,
    });
  }

  if (primaryFile.fileType !== "document") {
    console.info("[document-process] skipping non-document file", { documentId });
    return updateDocumentProcessingState(documentId, {
      previewStatus: "skipped",
      searchStatus: "skipped",
      previewError: null,
      searchError: null,
    });
  }

  const filename = primaryFile.originalName || (primaryFile.filePath.split("/").pop() ?? "documento");
  if (!isPdfFilename(filename)) {
    console.info("[document-process] skipping non-pdf document", { documentId, filename });
    return updateDocumentProcessingState(documentId, {
      previewStatus: "skipped",
      searchStatus: "skipped",
      previewError: null,
      searchError: null,
      searchText: null,
    });
  }

  await updateDocumentProcessingState(documentId, {
    previewStatus: "skipped",
    searchStatus: "pending",
    previewError: null,
    searchError: null,
  });

  try {
    const fileBuffer = await downloadDocumentFile(primaryFile.filePath);
    if (!fileBuffer) {
      throw new Error("Não foi possível descarregar o PDF para envio ao n8n.");
    }

    await triggerDocumentIndexingWebhooks({
      document_id: document.id,
      file_path: primaryFile.filePath,
      source_filename: filename,
      document_type: "document",
      title: document.title,
      version_number: document.currentVersion,
      file: new Blob([fileBuffer], { type: "application/pdf" }),
    });
  } catch (error) {
    console.error("[document-process] failed", { documentId, message: error instanceof Error ? error.message : "erro desconhecido" });
    return updateDocumentProcessingState(documentId, {
      previewStatus: "skipped",
      searchStatus: "failed",
      previewError: null,
      searchError: error instanceof Error ? error.message : "Falha ao disparar o webhook de indexação.",
    });
  }

  return updateDocumentProcessingState(documentId, {
    previewStatus: "skipped",
    searchStatus: "pending",
    previewError: null,
    searchError: null,
  });
}
