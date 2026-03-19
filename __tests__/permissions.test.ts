import {
  canApproveDocument,
  canEditDocument,
  canUploadVersion,
} from "@/lib/rbac";

describe("permissions on upload/edit/approval", () => {
  test("editor puede editar", () => {
    expect(canEditDocument("editor")).toBe(true);
  });

  test("viewer no puede subir fichero", () => {
    expect(canUploadVersion("viewer")).toBe(false);
  });

  test("manager puede aprobar", () => {
    expect(canApproveDocument("manager")).toBe(true);
  });
});
