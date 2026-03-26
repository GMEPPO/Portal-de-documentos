import {
  canApproveDocument,
  canEditDocument,
  canUploadVersion,
} from "@/lib/rbac";

describe("permissions on upload/edit/approval", () => {
  test("solo admin puede editar", () => {
    expect(canEditDocument("editor")).toBe(false);
    expect(canEditDocument("admin")).toBe(true);
  });

  test("viewer no puede subir fichero", () => {
    expect(canUploadVersion("viewer")).toBe(false);
  });

  test("solo admin puede aprobar", () => {
    expect(canApproveDocument("manager")).toBe(false);
    expect(canApproveDocument("admin")).toBe(true);
  });
});
