"use client";

import { useEffect, useState } from "react";

export function AuthDebugger() {
  const [status, setStatus] = useState<
    | { state: "idle" }
    | { state: "loading" }
    | { state: "ok"; roleSession: string | null; roleService: string | null }
    | { state: "error"; message: string }
  >({ state: "idle" });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setStatus({ state: "loading" });
      try {
        const res = await fetch("/api/auth/debug");
        const payload = (await res.json()) as any;

        if (!res.ok) {
          throw new Error(payload?.reason || "Error en /api/auth/debug");
        }

        if (cancelled) return;
        const roleSession = payload.profileSession?.role ?? null;
        const roleService = payload.profileService?.role ?? null;

        // Mensaje en consola del navegador (lo que te interesa para diagnostico).
        // No incluimos tokens ni claves.
        console.log("[auth-debug]", {
          userId: payload.userId,
          roleSession,
          roleService,
          sessionReadError: payload.sessionReadError,
          serviceReadError: payload.serviceReadError,
        });

        setStatus({ state: "ok", roleSession, roleService });
      } catch (e) {
        const message = e instanceof Error ? e.message : "Error desconocido";
        console.error("[auth-debug] error:", message);
        setStatus({ state: "error", message });
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

