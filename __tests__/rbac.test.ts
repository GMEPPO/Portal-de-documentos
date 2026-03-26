import {
  canApproveDocument,
  canEditDocument,
  canTransitionStatus,
  canUploadVersion,
} from "@/lib/rbac";

describe("RBAC", () => {
  test("viewer no puede editar", () => {
    expect(canEditDocument("viewer")).toBe(false);
  });

  test("solo admin puede aprobar", () => {
    expect(canApproveDocument("manager")).toBe(false);
    expect(canApproveDocument("admin")).toBe(true);
  });

  test("solo admin puede subir versiones", () => {
    expect(canUploadVersion("editor")).toBe(false);
    expect(canUploadVersion("admin")).toBe(true);
  });

  test("viewer no puede publicar", () => {
    expect(canTransitionStatus("viewer", "in_review", "published")).toBe(false);
  });
});
