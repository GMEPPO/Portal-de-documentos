import { generatePreviewPdf } from "@/lib/document-preview-service";
import { getDocumentById, updateDocumentProcessingState } from "@/lib/documents-service";
import { getDocumentFileType, isPdfFilename, isWordFilename } from "@/lib/document-file";
import type { DocumentProcessingStatus } from "@/lib/types";
import { extractPdfSearchTextFromBuffer, normalizeSearchText } from "@/lib/pdf-search-index";
import { getPreviewFileObjectPath } from "@/lib/storage-path";
import { downloadDocumentFile, uploadDocumentFile } from "@/lib/storage-service";

const MAX_SEARCHABLE_FILE_SIZE_BYTES = 8 * 1024 * 1024;

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

  await updateDocumentProcessingState(documentId, {
    previewStatus: isWordFilename(filename) ? "processing" : "skipped",
    searchStatus: "processing",
    previewError: null,
    searchError: null,
  });

  const mainBuffer = await downloadDocumentFile(document.mainFilePath);
  if (!mainBuffer) {
    throw new Error("Nao foi possivel descarregar o ficheiro principal.");
  }

  let previewFilePath = document.previewFilePath ?? null;
  let previewStatus: DocumentProcessingStatus = isWordFilename(filename) ? "failed" : "skipped";
  let previewError: string | null = null;
  let searchableBuffer: Buffer | null = null;

  if (isPdfFilename(filename)) {
    searchableBuffer = mainBuffer;
    previewStatus = "skipped";
  } else if (isWordFilename(filename)) {
    try {
      const sourceFile = new File([mainBuffer], filename, {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const previewFile = await generatePreviewPdf(sourceFile);

      if (previewFile) {
        previewFilePath = getPreviewFileObjectPath(documentId, previewFile.name);
        await uploadDocumentFile(previewFilePath, previewFile);
        searchableBuffer = Buffer.from(await previewFile.arrayBuffer());
        previewStatus = "ready";
      } else {
        previewStatus = "skipped";
      }
    } catch (error) {
      previewStatus = "failed";
      previewError =
        error instanceof Error ? error.message : "Falha ao gerar preview do ficheiro.";
    }
  }

  let searchStatus: "ready" | "failed" | "skipped" = "skipped";
  let searchError: string | null = null;
  let searchText: string | null = null;

  if (searchableBuffer) {
    if (searchableBuffer.byteLength > MAX_SEARCHABLE_FILE_SIZE_BYTES) {
      searchStatus = "skipped";
      searchError = "O ficheiro e demasiado grande para indexacao imediata.";
    } else {
      try {
        searchText = normalizeSearchText(extractPdfSearchTextFromBuffer(searchableBuffer));
        searchStatus = "ready";
      } catch (error) {
        searchStatus = "failed";
        searchError =
          error instanceof Error ? error.message : "Falha ao indexar o texto pesquisavel.";
      }
    }
  } else if (previewStatus === "failed") {
    searchStatus = "failed";
    searchError = previewError;
  }

  return updateDocumentProcessingState(documentId, {
    previewStatus,
    searchStatus,
    previewError,
    searchError,
    previewFilePath,
    searchText,
  });
}
