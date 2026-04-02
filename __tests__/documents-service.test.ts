import { addVersion, createDocument, deleteDocument, updateDocument } from "@/lib/documents-service";
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
});
