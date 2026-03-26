import { generatePreviewPdf } from "@/lib/document-preview-service";
import { getMainFileObjectPath, getPreviewFileObjectPath } from "@/lib/storage-path";
import { deleteDocumentFile, uploadDocumentFile } from "@/lib/storage-service";

export async function uploadDocumentAssets(documentId: string, file: File) {
  const mainPath = getMainFileObjectPath(documentId, file.name);
  const uploadedPaths: string[] = [];

  try {
    await uploadDocumentFile(mainPath, file);
    uploadedPaths.push(mainPath);

    const previewFile = await generatePreviewPdf(file);
    let previewPath: string | undefined;

    if (previewFile && previewFile.name !== file.name) {
      previewPath = getPreviewFileObjectPath(documentId, previewFile.name);
      await uploadDocumentFile(previewPath, previewFile);
      uploadedPaths.push(previewPath);
    }

    return {
      mainFilePath: mainPath,
      previewFilePath: previewPath,
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
