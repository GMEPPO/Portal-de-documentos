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
    expect(doc.documentType).toBe("document");
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
    const updated = await updateDocument(
      created.id,
      { summary: "Resumo alterado." },
      admin,
    );
    expect(updated.summary).toBe("Resumo alterado.");
  });

  test("guarda version con tipo de ficheiro y actualiza documento", async () => {
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
      {
        changelog: "Version inicial en video",
        filePath: "doc-1/main/video.mp4",
        fileType: "video",
        versionNumber: 1,
      },
      admin,
    );

    const updated = await updateDocument(
      created.id,
      { summary: "Resumo ajustado." },
      admin,
    );

    expect(version.fileType).toBe("video");
    expect(updated.documentType).toBe("video");
    expect(updated.previewStatus).toBe("skipped");
    expect(updated.searchStatus).toBe("skipped");
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
      {
        changelog: "Audio inicial",
        filePath: "doc-2/main/audio.mp3",
        fileType: "audio",
        versionNumber: 1,
      },
      admin,
    );

    const deleted = await deleteDocument(created.id, admin);

    expect(deleted.document.id).toBe(created.id);
    expect(deleted.document.documentType).toBe("audio");
    expect(deleted.paths).toContain("doc-2/main/audio.mp3");
  });

  test("permite sustituir la version actual al publicar desde revision", async () => {
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
      {
        changelog: "Versao inicial em revisao",
        filePath: "doc-3/main/original.docx",
        fileType: "document",
        versionNumber: 1,
      },
      admin,
    );

    const replaced = await replaceCurrentVersion(
      created.id,
      {
        changelog: "Versao 1 publicada em PDF",
        filePath: "doc-3/main/publicado.pdf",
        fileType: "document",
        previewFilePath: "doc-3/preview/publicado.pdf",
        versionNumber: 1,
      },
      admin,
    );

    expect(replaced.versionNumber).toBe(1);
    expect(replaced.filePath).toBe("doc-3/main/publicado.pdf");
  });

  test("marca processamento pendente para documentos ao subir nova versao", async () => {
    const created = await createDocument(
      {
        title: "Documento pendente",
        summary: "Resumo inicial suficiente para processamento posterior.",
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
      {
        changelog: "Versao inicial em pdf",
        filePath: "doc-4/main/publicado.pdf",
        fileType: "document",
        versionNumber: 1,
      },
      admin,
    );

    const updated = await updateDocument(created.id, { summary: "Resumo revisto." }, admin);
    expect(updated.previewStatus).toBe("pending");
    expect(updated.searchStatus).toBe("pending");
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
