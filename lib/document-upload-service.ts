import { generatePreviewPdf } from "@/lib/document-preview-service";
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

    try {
      const previewFile = await generatePreviewPdf(file);

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

    return {
      mainFilePath: mainPath,
      previewFilePath: previewPath,
      previewError,
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
