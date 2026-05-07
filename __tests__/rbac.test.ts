import {
  canApproveDocument,
  canEditDocument,
  canManageCommunications,
  canManageEvents,
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

describe("canManageCommunications", () => {
  test("admin pode gerir comunicações", () => {
    expect(canManageCommunications("admin")).toBe(true);
  });

  test("manager pode gerir comunicações", () => {
    expect(canManageCommunications("manager")).toBe(true);
  });

  test("editor não pode gerir comunicações", () => {
    expect(canManageCommunications("editor")).toBe(false);
  });

  test("viewer não pode gerir comunicações", () => {
    expect(canManageCommunications("viewer")).toBe(false);
  });
});

describe("canManageEvents", () => {
  test("admin pode gerir eventos", () => {
    expect(canManageEvents("admin")).toBe(true);
  });

  test("manager pode gerir eventos", () => {
    expect(canManageEvents("manager")).toBe(true);
  });

  test("editor não pode gerir eventos", () => {
    expect(canManageEvents("editor")).toBe(false);
  });

  test("viewer não pode gerir eventos", () => {
    expect(canManageEvents("viewer")).toBe(false);
  });
});
