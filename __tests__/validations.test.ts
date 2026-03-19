import { documentCreateSchema, documentUpdateSchema } from "@/lib/validations";

describe("Document validations", () => {
  test("creacion valida", () => {
    const parsed = documentCreateSchema.safeParse({
      title: "Procedimento base",
      summary: "Resumo funcional com requisitos obrigatorios.",
      categoryId: "cat-procedure",
      department: "Operaciones",
      ownerId: "u-manager",
      tags: ["interno"],
    });
    expect(parsed.success).toBe(true);
  });

  test("actualizacion invalida con estado desconocido", () => {
    const parsed = documentUpdateSchema.safeParse({ status: "xpto" });
    expect(parsed.success).toBe(false);
  });
});
