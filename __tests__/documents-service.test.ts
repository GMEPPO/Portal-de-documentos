import {
  addVersion,
  createDocument,
  deleteDocument,
  replaceCurrentVersion,
  updateDocument,
  updateDocumentSearchIndex,
} from "@/lib/documents-service";
import type { AppUser } from "@/lib/types";

const admin: AppUser = {
  id: "u-admin",
  name: "Admin",
  email: "admin@local",
  role: "admin",
  department: "Calidad",
};

describe("documents service", () => {
  test("crea documento", async () => {
    const doc = await createDocument(
      {
        title: "Nuevo documento tecnico",
        summary: "Resumen con contenido suficiente para validacion.",
        categoryId: "cat-procedure",
        department: "Calidad",
        versionNumber: 1,
        ownerId: "u-editor",
        tags: [],
      },
      admin,
    );
    expect(doc.id).toBeDefined();
    expect(doc.status).toBe("in_review");
  });

  test("actualiza documento", async () => {
    const created = await createDocument(
      {
        title: "Documento actualizable",
        summary: "Resumen inicial para actualizar.",
        categoryId: "cat-procedure",
        department: "Calidad",
        versionNumber: 1,
        ownerId: "u-editor",
        tags: [],
      },
      admin,
    );
    const updated = await updateDocument(created.id, { summary: "Resumo alterado." }, admin);
    expect(updated.summary).toBe("Resumo alterado.");
  });

  test("guarda version com ficheiros e actualiza documento", async () => {
    const created = await createDocument(
      {
        title: "Documento multimedia",
        summary: "Resumo inicial para publicar multimedia.",
        categoryId: "cat-procedure",
        department: "Calidad",
        versionNumber: 1,
        ownerId: "u-editor",
        tags: [],
      },
      admin,
    );

    const version = await addVersion(
      created.id,
      { changelog: "Version inicial en video", versionNumber: 1 },
      admin,
      [{ filePath: "doc-1/v/vid-1/file-0.mp4", fileType: "video", originalName: "video.mp4", sortOrder: 0 }],
    );

    expect(version.files?.[0]?.fileType).toBe("video");
    expect(version.versionNumber).toBe(1);
  });

  test("elimina documento y devuelve paths asociados", async () => {
    const created = await createDocument(
      {
        title: "Documento eliminable",
        summary: "Resumo con contenido suficiente para eliminacion.",
        categoryId: "cat-procedure",
        department: "Calidad",
        versionNumber: 1,
        ownerId: "u-editor",
        tags: [],
      },
      admin,
    );

    await addVersion(
      created.id,
      { changelog: "Audio inicial", versionNumber: 1 },
      admin,
      [{ filePath: "doc-2/v/ver-1/file-0.mp3", fileType: "audio", originalName: "audio.mp3", sortOrder: 0 }],
    );

    const deleted = await deleteDocument(created.id, admin);
    expect(deleted.document.id).toBe(created.id);
  });

  test("permite substituir a versão atual ao publicar desde revisão", async () => {
    const created = await createDocument(
      {
        title: "Documento em revisao",
        summary: "Resumo inicial suficiente para o fluxo de revisao.",
        categoryId: "cat-procedure",
        department: "Calidad",
        versionNumber: 1,
        ownerId: "u-editor",
        tags: [],
      },
      admin,
      { initialVersionNumber: 1 },
    );

    await addVersion(
      created.id,
      { changelog: "Versao inicial em revisao", versionNumber: 1 },
      admin,
      [{ filePath: "doc-3/v/ver-1/file-0.docx", fileType: "document", originalName: "original.docx", sortOrder: 0 }],
    );

    const replaced = await replaceCurrentVersion(
      created.id,
      { changelog: "Versao 1 publicada em PDF", versionNumber: 1 },
      admin,
      [{ filePath: "doc-3/v/ver-1/file-0.pdf", fileType: "document", originalName: "publicado.pdf", sortOrder: 0 }],
    );

    expect(replaced.versionNumber).toBe(1);
    expect(replaced.files?.[0]?.originalName).toBe("publicado.pdf");
  });

  test("guarda el indice de busqueda persistente en el documento", async () => {
    const created = await createDocument(
      {
        title: "Documento indexado",
        summary: "Resumo base para indexacao pesquisavel.",
        categoryId: "cat-procedure",
        department: "Calidad",
        versionNumber: 1,
        ownerId: "u-editor",
        tags: [],
      },
      admin,
    );

    const updated = await updateDocumentSearchIndex(
      created.id,
      "Email enviado diretamente pelo cliente e validado pelo comercial.",
    );

    expect(updated?.searchText).toContain("Email enviado diretamente");
  });
});
