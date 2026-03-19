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
  return hasMinimumRole(role, "editor");
}

export function canUploadVersion(role: UserRole) {
  return hasMinimumRole(role, "editor");
}

export function canApproveDocument(role: UserRole) {
  return hasMinimumRole(role, "manager");
}

export function canManageUsers(role: UserRole) {
  return role === "admin";
}

const transitionMap: Record<DocumentStatus, DocumentStatus[]> = {
  draft: ["in_review", "archived"],
  in_review: ["approved", "rejected", "draft"],
  approved: ["published", "archived"],
  published: ["archived"],
  archived: ["draft"],
  rejected: ["draft", "archived"],
};

export function canTransitionStatus(
  role: UserRole,
  from: DocumentStatus,
  to: DocumentStatus,
) {
  if (!transitionMap[from].includes(to)) {
    return false;
  }
  if (role === "admin") {
    return true;
  }
  if (to === "approved" || to === "published" || to === "rejected") {
    return canApproveDocument(role);
  }
  return canEditDocument(role);
}
