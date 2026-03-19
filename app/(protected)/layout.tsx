import { AppShell } from "@/components/app-shell";
import { requireAuth } from "@/lib/auth";
import { Toaster } from "@/components/ui/toaster";

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
