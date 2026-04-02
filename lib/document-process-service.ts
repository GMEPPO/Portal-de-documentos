import { getDocumentById, updateDocumentProcessingState } from "@/lib/documents-service";
import { getDocumentFileType, isPdfFilename } from "@/lib/document-file";
import { triggerDocumentIndexingWebhook } from "@/lib/n8n-webhook";

export async function processDocumentAssets(documentId: string) {
  const document = await getDocumentById(documentId);
  if (!document || !document.mainFilePath) {
    throw new Error("Documento sem ficheiro principal para processar.");
  }

  if (
    (document.previewStatus === "ready" || document.previewStatus === "skipped") &&
    (document.searchStatus === "ready" || document.searchStatus === "skipped") &&
    !document.previewError &&
    !document.searchError
  ) {
    return document;
  }

  const filename = document.mainFilePath.split("/").pop() ?? "documento";
  const fileType = getDocumentFileType(filename);
  if (fileType !== "document") {
    return updateDocumentProcessingState(documentId, {
      previewStatus: "skipped",
      searchStatus: "skipped",
      previewError: null,
      searchError: null,
    });
  }

  if (!isPdfFilename(filename)) {
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
    await triggerDocumentIndexingWebhook({
      document_id: document.id,
      file_path: document.mainFilePath,
      source_filename: filename,
      document_type: document.documentType,
      title: document.title,
      version_number: document.currentVersion,
    });
  } catch (error) {
    return updateDocumentProcessingState(documentId, {
      previewStatus: "skipped",
      searchStatus: "failed",
      previewError: null,
      searchError:
        error instanceof Error ? error.message : "Falha ao disparar o webhook de indexacao.",
    });
  }

  return updateDocumentProcessingState(documentId, {
    previewStatus: "skipped",
    searchStatus: "pending",
    previewError: null,
    searchError: null,
  });
}
