import { getMainFileObjectPath } from "@/lib/storage-path";
import { deleteDocumentFile, uploadDocumentFile } from "@/lib/storage-service";

export async function uploadDocumentAssets(documentId: string, file: File) {
  const mainPath = getMainFileObjectPath(documentId, file.name);
  const uploadedPaths: string[] = [];

  try {
    await uploadDocumentFile(mainPath, file);
    uploadedPaths.push(mainPath);

    return {
      mainFilePath: mainPath,
      previewFilePath: undefined,
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
