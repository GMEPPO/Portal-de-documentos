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

  test("manager puede aprobar", () => {
    expect(canApproveDocument("manager")).toBe(true);
  });

  test("editor puede subir versiones", () => {
    expect(canUploadVersion("editor")).toBe(true);
  });

  test("viewer no puede publicar", () => {
    expect(canTransitionStatus("viewer", "approved", "published")).toBe(false);
  });
});
