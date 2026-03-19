import { redirect } from "next/navigation";
import { mockUsers } from "@/lib/constants";
import { canManageUsers } from "@/lib/rbac";
import type { AppUser, UserRole } from "@/lib/types";

export async function getCurrentUser(): Promise<AppUser> {
  return mockUsers[0];
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireRole(required: UserRole) {
  const user = await requireAuth();
  const roleOrder: Record<UserRole, number> = {
    viewer: 1,
    editor: 2,
    manager: 3,
    admin: 4,
  };
  if (roleOrder[user.role] < roleOrder[required]) {
    redirect("/unauthorized");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (!canManageUsers(user.role)) {
    redirect("/unauthorized");
  }
  return user;
}
