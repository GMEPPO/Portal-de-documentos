import { documentCreateSchema, documentUpdateSchema, versionSchema } from "@/lib/validations";

describe("Document validations", () => {
  test("creacion valida", () => {
    const parsed = documentCreateSchema.safeParse({
      title: "Procedimento base",
      summary: "Resumo funcional com requisitos obrigatorios.",
      categoryId: "cat-procedure",
      department: "Operaciones",
      versionNumber: 1,
      ownerId: "u-manager",
      tags: ["interno"],
    });
    expect(parsed.success).toBe(true);
  });

  test("actualizacion invalida con estado desconocido", () => {
    const parsed = documentUpdateSchema.safeParse({ status: "xpto" });
    expect(parsed.success).toBe(false);
  });

  test("version valida con tipo de fichero soportado", () => {
    const parsed = versionSchema.safeParse({
      changelog: "Alta inicial de video",
      filePath: "doc/main/demo.mp4",
      fileType: "video",
      versionNumber: 1,
    });
    expect(parsed.success).toBe(true);
  });

  test("version valida para documento Word", () => {
    const parsed = versionSchema.safeParse({
      changelog: "Alta inicial de Word",
      filePath: "doc/main/demo.docx",
      fileType: "document",
      versionNumber: 1,
    });
    expect(parsed.success).toBe(true);
  });

  test("version invalida sin tipo de fichero soportado", () => {
    const parsed = versionSchema.safeParse({
      changelog: "Alta inicial",
      filePath: "doc/main/demo.exe",
      versionNumber: 1,
    });
    expect(parsed.success).toBe(false);
  });
});
