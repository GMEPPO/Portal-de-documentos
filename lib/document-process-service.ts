import { getDocumentById, updateDocumentProcessingState } from "@/lib/documents-service";
import { getDocumentFileType, isPdfFilename } from "@/lib/document-file";
import { triggerDocumentIndexingWebhooks } from "@/lib/n8n-webhook";
import { downloadDocumentFile } from "@/lib/storage-service";

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
    const fileBuffer = await downloadDocumentFile(document.mainFilePath);
    if (!fileBuffer) {
      throw new Error("Nao foi possivel descarregar o PDF para envio ao n8n.");
    }

    await triggerDocumentIndexingWebhooks({
      document_id: document.id,
      file_path: document.mainFilePath,
      source_filename: filename,
      document_type: document.documentType,
      title: document.title,
      version_number: document.currentVersion,
      file: new Blob([fileBuffer], { type: "application/pdf" }),
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
