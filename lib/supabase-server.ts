import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Cliente "normal" (anon) para lectura de sesión/auth en SSR.
  // Las operaciones privilegiadas van por la service role en otro client.
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  const cookieStore = cookies();
  return createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        // En Server Components, Next puede bloquear escritura de cookies.
        // Evitamos romper el render por intentos de refresh de sesión.
        try {
          cookieStore.set({ name, value, ...(options as object) });
        } catch {
          // noop
        }
      },
      remove(name: string, options: Record<string, unknown>) {
        try {
          cookieStore.set({ name, value: "", ...(options as object) });
        } catch {
          // noop
        }
      },
    },
  });
}
