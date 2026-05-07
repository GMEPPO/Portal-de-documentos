import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { deleteVersion, patchDocumentVersion } from "@/lib/documents-service";
import { deleteDocumentFiles } from "@/lib/storage-service";
import { getDocumentFileType } from "@/lib/document-file";
import { uploadVersionFiles } from "@/lib/document-upload-service";
import { versionAdminPatchSchema } from "@/lib/validations";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; versionId: string } },
) {
  const user = await requireAuth();
  let uploadedPaths: string[] = [];

  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const rawFiles = form.getAll("files[]");
      const files: File[] = rawFiles.filter((f): f is File => f instanceof File);
      const changelogField = form.get("changelog");
      const changelog =
        typeof changelogField === "string" ? changelogField.trim() : undefined;
      const deleteFileIds = form
        .getAll("deleteFileIds[]")
        .filter((v): v is string => typeof v === "string");

      if (files.length === 0 && deleteFileIds.length === 0 && (!changelog || changelog.length < 3)) {
        return NextResponse.json(
          { error: "Indica um registo de alterações (mín. 3 caracteres) ou anexa novos ficheiros." },
          { status: 400 },
        );
      }

      for (const file of files) {
        if (!getDocumentFileType(file.name)) {
          return NextResponse.json(
            { error: `Formato não suportado: ${file.name}. Usa PDF, Word, MP4, MP3 ou M4A.` },
            { status: 400 },
          );
        }
      }

      const uploaded =
        files.length > 0
          ? await uploadVersionFiles(params.id, params.versionId, files)
          : [];
      uploadedPaths = uploaded.map((f) => f.filePath);

      const { version, obsoleteFilePaths } = await patchDocumentVersion(
        params.id,
        params.versionId,
        user,
        {
          changelog: changelog && changelog.length >= 3 ? changelog : undefined,
          files: uploaded.length > 0 ? uploaded : undefined,
          deleteFileIds: deleteFileIds.length > 0 ? deleteFileIds : undefined,
        },
      );

      if (obsoleteFilePaths.length > 0) {
        try {
          await deleteDocumentFiles(obsoleteFilePaths);
        } catch {
          /* noop */
        }
      }

      return NextResponse.json({ data: version, processingQueued: uploaded.length > 0 });
    }

    const body = await request.json();
    const parsed = versionAdminPatchSchema.parse(body);
    const { version, obsoleteFilePaths } = await patchDocumentVersion(
      params.id,
      params.versionId,
      user,
      { changelog: parsed.changelog },
    );

    if (obsoleteFilePaths.length > 0) {
      try {
        await deleteDocumentFiles(obsoleteFilePaths);
      } catch {
        /* noop */
      }
    }

    return NextResponse.json({ data: version });
  } catch (error) {
    if (uploadedPaths.length > 0) {
      try {
        await deleteDocumentFiles(uploadedPaths);
      } catch {
        /* noop */
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro inesperado." },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: { id: string; versionId: string } },
) {
  const user = await requireAuth();
  try {
    const { version, paths } = await deleteVersion(params.id, params.versionId, user);
    if (paths.length > 0) {
      try {
        await deleteDocumentFiles(paths);
      } catch {
        /* noop */
      }
    }
    return NextResponse.json({ data: version });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro inesperado." },
      { status: 400 },
    );
  }
}
