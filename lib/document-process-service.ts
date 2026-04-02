import { getDocumentById, updateDocumentProcessingState } from "@/lib/documents-service";
import { getDocumentFileType, isPdfFilename } from "@/lib/document-file";
import { triggerDocumentIndexingWebhooks } from "@/lib/n8n-webhook";
import { downloadDocumentFile } from "@/lib/storage-service";

export async function processDocumentAssets(documentId: string) {
  console.info("[document-process] start", { documentId });
  const document = await getDocumentById(documentId);
  if (!document || !document.mainFilePath) {
    console.error("[document-process] missing document or main file", { documentId });
    throw new Error("Documento sem ficheiro principal para processar.");
  }

  if (
    (document.previewStatus === "ready" || document.previewStatus === "skipped") &&
    (document.searchStatus === "ready" || document.searchStatus === "skipped") &&
    !document.previewError &&
    !document.searchError
  ) {
    console.info("[document-process] skipping because document already processed", {
      documentId,
      searchStatus: document.searchStatus,
      previewStatus: document.previewStatus,
    });
    return document;
  }

  const filename = document.mainFilePath.split("/").pop() ?? "documento";
  const fileType = getDocumentFileType(filename);
  console.info("[document-process] resolved file", {
    documentId,
    filename,
    fileType,
    mainFilePath: document.mainFilePath,
  });
  if (fileType !== "document") {
    console.info("[document-process] skipping non-document file", {
      documentId,
      fileType,
    });
    return updateDocumentProcessingState(documentId, {
      previewStatus: "skipped",
      searchStatus: "skipped",
      previewError: null,
      searchError: null,
    });
  }

  if (!isPdfFilename(filename)) {
    console.info("[document-process] skipping non-pdf document", {
      documentId,
      filename,
    });
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
      console.error("[document-process] could not download pdf", {
        documentId,
        mainFilePath: document.mainFilePath,
      });
      throw new Error("Nao foi possivel descarregar o PDF para envio ao n8n.");
    }

    console.info("[document-process] downloaded pdf", {
      documentId,
      bytes: fileBuffer.byteLength,
      mainFilePath: document.mainFilePath,
    });

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
    console.error("[document-process] failed", {
      documentId,
      message: error instanceof Error ? error.message : "erro desconhecido",
    });
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
