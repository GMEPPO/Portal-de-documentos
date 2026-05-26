import Link from "next/link";
import { FileText, Home, Mail, MessageCircleQuestion, Shield } from "lucide-react";
import type { AppUser, Locale } from "@/lib/types";
import { LogoutButton } from "@/components/auth/logout-button";
import { canManageCommunications, canManageUsers } from "@/lib/rbac";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getLocaleOptions, getRoleLabel } from "@/lib/i18n-shared";

const navItems = [
  { href: "/dashboard", labelKey: "dashboard", icon: Home },
  { href: "/documents", labelKey: "documents", icon: FileText },
  { href: "/communications", labelKey: "communications", icon: Mail },
  { href: "/tira-duvidas", labelKey: "tiraDuvidas", icon: MessageCircleQuestion },
  { href: "/admin", labelKey: "admin", icon: Shield },
] as const;

export function AppShell({
  user,
  locale,
  labels,
  children,
}: {
  user: AppUser;
  locale: Locale;
  labels: {
    appTitle: string;
    nav: {
      dashboard: string;
      documents: string;
      communications: string;
      tiraDuvidas: string;
      admin: string;
    };
    signOut: string;
    languageLabel: string;
  };
  children: React.ReactNode;
}) {
  const visibleNavItems = navItems.filter((item) => {
    if (item.href.startsWith("/admin")) return canManageUsers(user.role);
    if (item.href.startsWith("/communications")) return canManageCommunications(user.role);
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="border-b border-slate-700 bg-slate-800/90">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <p className="font-semibold tracking-tight text-amber-400">{labels.appTitle}</p>
          <nav className="flex items-center gap-2">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                  {labels.nav[item.labelKey]}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <LanguageSwitcher
              currentLocale={locale}
              options={getLocaleOptions()}
              ariaLabel={labels.languageLabel}
            />
            <span>
              {user.name} · <span className="uppercase text-amber-300">{user.role}</span>
            </span>
            <LogoutButton label={labels.signOut} />
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
