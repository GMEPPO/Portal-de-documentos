import type { DocumentStatus, UserRole } from "@/lib/types";

const roleWeight: Record<UserRole, number> = {
  viewer: 1,
  editor: 2,
  manager: 3,
  admin: 4,
};

export function hasMinimumRole(role: UserRole, required: UserRole) {
  return roleWeight[role] >= roleWeight[required];
}

export function canViewDocument(role: UserRole) {
  return hasMinimumRole(role, "viewer");
}

export function canEditDocument(role: UserRole) {
  return role === "admin";
}

export function canUploadVersion(role: UserRole) {
  return role === "admin";
}

export function canApproveDocument(role: UserRole) {
  return role === "admin";
}

export function canManageUsers(role: UserRole) {
  return role === "admin";
}

export function canManageCommunications(role: UserRole) {
  return hasMinimumRole(role, "manager");
}

export function canManageEvents(role: UserRole) {
  return hasMinimumRole(role, "manager");
}

const transitionMap: Record<DocumentStatus, DocumentStatus[]> = {
  in_review: ["published"],
  updating: ["published"],
  published: ["updating"],
};

export const documentStatusLabels: Record<DocumentStatus, string> = {
  in_review: "Em revisao",
  updating: "Em atualizacao",
  published: "Publicado",
};

export function canTransitionStatus(
  role: UserRole,
  from: DocumentStatus,
  to: DocumentStatus,
) {
  if (role !== "admin") {
    return false;
  }
  if (!transitionMap[from].includes(to)) {
    return false;
  }
  return true;
}

export function getAllowedTransitions(
  role: UserRole,
  from: DocumentStatus,
) {
  return transitionMap[from].filter((to) => canTransitionStatus(role, from, to));
}

export function canAccessDocumentStatus(
  role: UserRole,
  status: DocumentStatus,
) {
  if (role === "admin") {
    return true;
  }
  return status === "published";
}
