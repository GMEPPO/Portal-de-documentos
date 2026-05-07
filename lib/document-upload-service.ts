import { getVersionFileObjectPath } from "@/lib/storage-path";
import { deleteDocumentFile, uploadDocumentFile } from "@/lib/storage-service";
import { getDocumentFileType } from "@/lib/document-file";

export interface UploadedVersionFile {
  filePath: string;
  fileType: NonNullable<ReturnType<typeof getDocumentFileType>>;
  originalName: string;
  sortOrder: number;
}

export async function uploadVersionFiles(
  documentId: string,
  versionId: string,
  files: File[],
): Promise<UploadedVersionFile[]> {
  const uploaded: UploadedVersionFile[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileType = getDocumentFileType(file.name);
    if (!fileType) {
      for (const u of uploaded.reverse()) {
        try { await deleteDocumentFile(u.filePath); } catch { /* noop */ }
      }
      throw new Error(`Formato não suportado: ${file.name}. Usa PDF, Word, MP4, MP3 ou M4A.`);
    }

    const path = getVersionFileObjectPath(documentId, versionId, file.name, i);
    try {
      await uploadDocumentFile(path, file);
      uploaded.push({ filePath: path, fileType, originalName: file.name, sortOrder: i });
    } catch (error) {
      for (const u of uploaded.reverse()) {
        try { await deleteDocumentFile(u.filePath); } catch { /* noop */ }
      }
      throw error;
    }
  }

  return uploaded;
}
