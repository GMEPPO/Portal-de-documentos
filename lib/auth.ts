import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseServiceServerClient } from "@/lib/supabase-service-server";
import { canManageUsers } from "@/lib/rbac";
import type { AppUser, UserRole } from "@/lib/types";

async function ensureUserProfile(opts: {
  supabase: ReturnType<typeof createSupabaseServiceServerClient>;
  userId: string;
  email: string | null;
}) {
  if (!opts.supabase) return null;

  const { data: existing } = await opts.supabase
    .from("users")
    .select("id")
    .eq("id", opts.userId)
    .maybeSingle();

  if (existing) return existing;

  const name = opts.email ? opts.email.split("@")[0] : "Usuario";

  // Insertamos SOLO si no existe. Si por carrera/condiciones ya existiera,
  // no queremos sobrescribir un role ya asignado.
  const { data: inserted, error } = await opts.supabase
    .from("users")
    .insert({
      id: opts.userId,
      name,
      email: opts.email ?? `${opts.userId}@local`,
      role: "viewer",
      department: "General",
    })
    .select("id, name, email, role, department")
    .single();

  if (error) {
    // Si falló por conflicto, volvemos a leer la fila existente.
    const { data: existingProfile } = await opts.supabase
      .from("users")
      .select("id, name, email, role, department")
      .eq("id", opts.userId)
      .maybeSingle();

    return existingProfile ?? null;
  }

  return inserted ?? null;
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const supabaseAuth = createSupabaseServerClient();
  if (!supabaseAuth) return null;

  const { data, error } = await supabaseAuth.auth.getUser();
  if (error || !data.user) return null;

  // Asegura que exista un perfil de app (tabla publica.users) para RBAC.
  const { user } = data;

  // Para leer el perfil (role), usamos el cliente "auth" (con sesión)
  // para que el resultado sea consistente con RLS/policies.
  const { data: profile, error: profileError } = await supabaseAuth
    .from("users")
    .select("id, name, email, role, department")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    // Si RLS/policies están bloqueando la lectura, intentamos con service role
    // para evitar que el UI muestre el rol incorrecto (viewer por fallback).
    const supabaseService = createSupabaseServiceServerClient();
    if (supabaseService) {
      const { data: profileByService } = await supabaseService
        .from("users")
        .select("id, name, email, role, department")
        .eq("id", user.id)
        .maybeSingle();

      if (profileByService) return profileByService as AppUser;
    }

    // Último recurso: no tocamos la tabla.
    return {
      id: user.id,
      name: user.email ? user.email.split("@")[0] : "Usuario",
      email: user.email ?? "",
      role: "viewer",
      department: "General",
    };
  }

  if (!profile) {
    const supabaseService = createSupabaseServiceServerClient();
    if (!supabaseService) return null;
    await ensureUserProfile({
      supabase: supabaseService,
      userId: user.id,
      email: user.email ?? null,
    });
  }

  const { data: refreshedProfile, error: refreshedError } = await supabaseAuth
    .from("users")
    .select("id, name, email, role, department")
    .eq("id", user.id)
    .maybeSingle();

  if (!refreshedProfile || refreshedError) {
    // Fallback defensivo en caso de fallo de DB
    return {
      id: user.id,
      name: user.email ? user.email.split("@")[0] : "Usuario",
      email: user.email ?? "",
      role: "viewer",
      department: "General",
    };
  }

  return refreshedProfile as AppUser;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
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
