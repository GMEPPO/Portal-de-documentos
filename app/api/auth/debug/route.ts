import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseServiceServerClient } from "@/lib/supabase-service-server";

export async function GET() {
  const supabaseAuth = createSupabaseServerClient();
  if (!supabaseAuth) {
    return NextResponse.json(
      { ok: false, reason: "Supabase no configurado" },
      { status: 500 },
    );
  }

  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, reason: "No autenticado" }, { status: 401 });
  }

  // Leer perfil con cliente "auth" (anon + cookies/sesión).
  const { data: profileSession, error: sessionReadError } = await supabaseAuth
    .from("users")
    .select("id, role, department, email, name")
    .eq("id", user.id)
    .maybeSingle();

  // Leer perfil con service role (solo para diagnóstico).
  const supabaseService = createSupabaseServiceServerClient();
  const { data: profileService, error: serviceReadError } = supabaseService
    ? await supabaseService
        .from("users")
        .select("id, role, department, email, name")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null, error: null };

  return NextResponse.json({
    ok: true,
    userId: user.id,
    profileSession: profileSession ?? null,
    profileService: profileService ?? null,
    sessionReadError: sessionReadError?.message ?? null,
    serviceReadError: serviceReadError?.message ?? null,
  });
}

