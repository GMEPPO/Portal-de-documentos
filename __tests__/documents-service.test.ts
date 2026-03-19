import { createDocument, updateDocument } from "@/lib/documents-service";
import type { AppUser } from "@/lib/types";

const editor: AppUser = {
  id: "u-editor",
  name: "Editor",
  email: "editor@local",
  role: "editor",
  department: "Calidad",
};

describe("documents service", () => {
  test("crea documento", () => {
    const doc = createDocument(
      {
        title: "Nuevo documento tecnico",
        summary: "Resumen con contenido suficiente para validacion.",
        categoryId: "cat-procedure",
        department: "Calidad",
        ownerId: "u-editor",
        tags: [],
      },
      editor,
    );
    expect(doc.id).toBeDefined();
    expect(doc.status).toBe("draft");
  });

  test("actualiza documento", () => {
    const created = createDocument(
      {
        title: "Documento actualizable",
        summary: "Resumen inicial para actualizar.",
        categoryId: "cat-procedure",
        department: "Calidad",
        ownerId: "u-editor",
        tags: [],
      },
      editor,
    );
    const updated = updateDocument(created.id, { summary: "Resumo alterado." }, editor);
    expect(updated.summary).toBe("Resumo alterado.");
  });
});
