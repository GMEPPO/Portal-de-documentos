import { createDocument, updateDocument } from "@/lib/documents-service";
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
    const updated = await updateDocument(
      created.id,
      { summary: "Resumo alterado." },
      admin,
    );
    expect(updated.summary).toBe("Resumo alterado.");
  });
});
