import { canTransitionStatus } from "@/lib/rbac";

describe("state transitions", () => {
  test("admin puede publicar desde revision", () => {
    expect(canTransitionStatus("admin", "in_review", "published")).toBe(true);
  });

  test("editor no puede publicar", () => {
    expect(canTransitionStatus("editor", "in_review", "published")).toBe(false);
  });

  test("published pasa a atualizacao", () => {
    expect(canTransitionStatus("admin", "published", "updating")).toBe(true);
  });

  test("updating vuelve a publicado", () => {
    expect(canTransitionStatus("admin", "updating", "published")).toBe(true);
  });
});
