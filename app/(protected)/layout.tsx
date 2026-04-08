import { AppShell } from "@/components/app-shell";
import { requireAuth } from "@/lib/auth";
import { Toaster } from "@/components/ui/toaster";
import { getDictionary } from "@/lib/dictionary";
import { getLocale } from "@/lib/i18n";

// Forzamos dinamismo: `requireAuth()` depende de cookies/sesion y de la DB.
// Sin esto, Next puede cachear y devolver un rol antiguo.
export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  const locale = getLocale();
  const dictionary = getDictionary(locale);
  return (
    <AppShell user={user} locale={locale} labels={dictionary.shell}>
      {children}
      <Toaster />
    </AppShell>
  );
}
