import { generatePreviewPdf } from "@/lib/document-preview-service";
import { extractPdfSearchTextFromFile } from "@/lib/pdf-search-index";
import { getMainFileObjectPath, getPreviewFileObjectPath } from "@/lib/storage-path";
import { deleteDocumentFile, uploadDocumentFile } from "@/lib/storage-service";

export async function uploadDocumentAssets(documentId: string, file: File) {
  const mainPath = getMainFileObjectPath(documentId, file.name);
  const uploadedPaths: string[] = [];

  try {
    await uploadDocumentFile(mainPath, file);
    uploadedPaths.push(mainPath);

    let previewPath: string | undefined;
    let previewError: string | undefined;
    let previewFile: File | null = null;
    let searchText = "";
    let searchIndexWarning: string | undefined;

    try {
      previewFile = await generatePreviewPdf(file);

      if (previewFile && previewFile.name !== file.name) {
        previewPath = getPreviewFileObjectPath(documentId, previewFile.name);
        await uploadDocumentFile(previewPath, previewFile);
        uploadedPaths.push(previewPath);
      }
    } catch (error) {
      previewError =
        error instanceof Error ? error.message : "Falha ao gerar preview do ficheiro.";
      console.warn("[document-upload-service] preview skipped:", previewError);
    }

    try {
      const searchablePdf =
        previewFile?.name?.toLowerCase().endsWith(".pdf")
          ? previewFile
          : file.name.toLowerCase().endsWith(".pdf")
            ? file
            : null;

      if (searchablePdf) {
        searchText = await extractPdfSearchTextFromFile(searchablePdf);
      }
    } catch (error) {
      searchIndexWarning =
        error instanceof Error ? error.message : "Falha ao indexar o texto pesquisavel.";
      console.warn("[document-upload-service] search indexing skipped:", searchIndexWarning);
    }

    return {
      mainFilePath: mainPath,
      previewFilePath: previewPath,
      previewError,
      searchText,
      searchIndexWarning,
      uploadedPaths,
    };
  } catch (error) {
    for (const path of uploadedPaths.reverse()) {
      try {
        await deleteDocumentFile(path);
      } catch {
        // noop
      }
    }
    throw error;
  }
}
