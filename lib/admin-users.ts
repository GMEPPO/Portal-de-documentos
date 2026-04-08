import type { User } from "@supabase/supabase-js";
import type { AppUser, UserRole } from "@/lib/types";
import {
  adminUserCreateSchema,
  adminUserUpdateSchema,
  userRoleSchema,
} from "@/lib/validations";
import { createSupabaseServiceServerClient } from "@/lib/supabase-service-server";

export const adminRoleOptions: UserRole[] = [...userRoleSchema.options];

export interface ManagedUser extends AppUser {
  hasAuthAccount: boolean;
  hasProfile: boolean;
  createdAt: string | null;
  lastSignInAt: string | null;
}

class AdminUsersError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminUsersError";
  }
}

function getSupabaseErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) {
      return maybeMessage;
    }
  }

  try {
    return JSON.stringify(error);
  } catch {
    // noop
  }

  return "Error desconocido";
}

function getServiceClient() {
  const supabase = createSupabaseServiceServerClient();
  if (!supabase) {
    throw new AdminUsersError(
      "Falta SUPABASE_SERVICE_ROLE_KEY o NEXT_PUBLIC_SUPABASE_URL en el entorno del servidor.",
    );
  }
  return supabase;
}

function fallbackName(email?: string | null) {
  if (!email) return "Usuario";
  return email.split("@")[0] || "Usuario";
}

function mapManagedUser(profile: Partial<AppUser> | null, authUser?: User): ManagedUser {
  const email = profile?.email ?? authUser?.email ?? "";

  return {
    id: profile?.id ?? authUser?.id ?? "",
    name: profile?.name ?? fallbackName(email),
    email,
    role: profile?.role ?? "viewer",
    department: profile?.department ?? "General",
    hasAuthAccount: Boolean(authUser),
    hasProfile: Boolean(profile?.id),
    createdAt: authUser?.created_at ?? null,
    lastSignInAt: authUser?.last_sign_in_at ?? null,
  };
}

async function listAllAuthUsers() {
  const supabase = getServiceClient();
  const users: User[] = [];
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw new AdminUsersError(
        `Fallo en Supabase Auth admin al listar usuarios: ${getSupabaseErrorMessage(error)}`,
      );
    }

    users.push(...data.users);

    if (data.users.length < perPage) {
      break;
    }
    page += 1;
  }

  return users;
}

async function getAuthUserById(userId: string) {
  const supabase = getServiceClient();
  const { data, error } = await supabase.auth.admin.getUserById(userId);

  if (error) {
    if (error.message.toLowerCase().includes("not found")) {
      return null;
    }
    throw error;
  }

  return data.user ?? null;
}

export async function listManagedUsers() {
  const supabase = getServiceClient();
  const authUsers = await listAllAuthUsers();
  const profilesResult = await supabase
    .from("users")
    .select("id, name, email, role, department, created_at")
    .order("created_at", { ascending: true });

  if (profilesResult.error) {
    throw new AdminUsersError(
      `Fallo al leer public.users con service role: ${getSupabaseErrorMessage(profilesResult.error)}`,
    );
  }

  const profileMap = new Map(
    (profilesResult.data ?? []).map((profile) => [profile.id, profile]),
  );
  const authMap = new Map(authUsers.map((user) => [user.id, user]));
  const ids = new Set([...profileMap.keys(), ...authMap.keys()]);

  return Array.from(ids)
    .map((id) => mapManagedUser(profileMap.get(id) ?? null, authMap.get(id)))
    .sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));
}

function normalizeText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value: FormDataEntryValue | null) {
  return normalizeText(value).toLowerCase();
}

async function upsertUserProfile(input: {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  department: string;
}) {
  const supabase = getServiceClient();

  const { error } = await supabase.from("users").upsert(
    {
      id: input.userId,
      email: input.email,
      name: input.name,
      role: input.role,
      department: input.department,
    },
    {
      onConflict: "id",
    },
  );

  if (error) {
    throw error;
  }
}

export async function createManagedUser(actor: AppUser, formData: FormData) {
  const input = adminUserCreateSchema.parse({
    name: normalizeText(formData.get("name")),
    email: normalizeEmail(formData.get("email")),
    password: normalizeText(formData.get("password")),
    department: normalizeText(formData.get("department")),
    role: formData.get("role"),
  });

  const supabase = getServiceClient();
  const { data, error } = await supabase.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      name: input.name,
      department: input.department,
      role: input.role,
      createdBy: actor.id,
    },
  });

  if (error || !data.user) {
    throw error ?? new Error("No fue posible crear el usuario en Supabase Auth.");
  }

  try {
    await upsertUserProfile({
      userId: data.user.id,
      email: input.email,
      name: input.name,
      role: input.role,
      department: input.department,
    });
  } catch (profileError) {
    await supabase.auth.admin.deleteUser(data.user.id);
    throw profileError;
  }
}

export async function updateManagedUser(actor: AppUser, formData: FormData) {
  const input = adminUserUpdateSchema.parse({
    userId: normalizeText(formData.get("userId")),
    email: normalizeEmail(formData.get("email")),
    name: normalizeText(formData.get("name")),
    department: normalizeText(formData.get("department")),
    role: formData.get("role"),
  });

  if (actor.id === input.userId && input.role !== "admin") {
    throw new Error("No puedes quitarte a ti mismo el rol de administrador.");
  }

  const supabase = getServiceClient();
  const authUser = await getAuthUserById(input.userId);
  const email = authUser?.email ?? input.email;
  if (!email) {
    throw new Error("El usuario no tiene email disponible para sincronizar el perfil.");
  }

  await upsertUserProfile({
    userId: input.userId,
    email,
    name: input.name,
    role: input.role,
    department: input.department,
  });

  if (authUser) {
    await supabase.auth.admin.updateUserById(input.userId, {
      user_metadata: {
        ...(authUser.user_metadata ?? {}),
        name: input.name,
        department: input.department,
        role: input.role,
        updatedBy: actor.id,
      },
    });
  }
}

async function assertUserHasNoReferences(userId: string) {
  const supabase = getServiceClient();
  const checks = await Promise.all([
    supabase.from("documents").select("id", { count: "exact", head: true }).eq("author_id", userId),
    supabase.from("documents").select("id", { count: "exact", head: true }).eq("owner_id", userId),
    supabase.from("document_comments").select("id", { count: "exact", head: true }).eq("author_id", userId),
    supabase.from("document_versions").select("id", { count: "exact", head: true }).eq("created_by", userId),
    supabase.from("audit_logs").select("id", { count: "exact", head: true }).eq("actor_id", userId),
  ]);

  const failed = checks.find((result) => result.error);
  if (failed?.error) {
    throw failed.error;
  }

  const totalReferences = checks.reduce((sum, result) => sum + (result.count ?? 0), 0);
  if (totalReferences > 0) {
    throw new Error(
      "No se puede eliminar este usuario porque tiene documentos, versiones, comentarios o auditoria asociados.",
    );
  }
}

export async function deleteManagedUser(actor: AppUser, formData: FormData) {
  const userId = normalizeText(formData.get("userId"));

  if (!userId) {
    throw new Error("Falta el identificador del usuario.");
  }

  if (actor.id === userId) {
    throw new Error("No puedes eliminar tu propia cuenta desde la administracion.");
  }

  await assertUserHasNoReferences(userId);

  const supabase = getServiceClient();
  const authUser = await getAuthUserById(userId);

  if (authUser) {
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    if (authError) {
      throw authError;
    }
  }

  const { error: profileError } = await supabase.from("users").delete().eq("id", userId);
  if (profileError) {
    throw profileError;
  }
}
