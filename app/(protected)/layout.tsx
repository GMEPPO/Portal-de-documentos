import { AppShell } from "@/components/app-shell";
import { requireAuth } from "@/lib/auth";
import { Toaster } from "@/components/ui/toaster";

// Forzamos dinamismo: `requireAuth()` depende de cookies/sesion y de la DB.
// Sin esto, Next puede cachear y devolver un rol antiguo.
export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  return (
    <AppShell user={user}>
      {children}
      <Toaster />
    </AppShell>
  );
}
