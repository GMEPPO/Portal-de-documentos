import { canTransitionStatus } from "@/lib/rbac";

describe("state transitions", () => {
  test("manager puede aprobar desde revision", () => {
    expect(canTransitionStatus("manager", "in_review", "approved")).toBe(true);
  });

  test("editor no puede publicar", () => {
    expect(canTransitionStatus("editor", "approved", "published")).toBe(false);
  });

  test("transicion inexistente falla", () => {
    expect(canTransitionStatus("admin", "draft", "published")).toBe(false);
  });
});
