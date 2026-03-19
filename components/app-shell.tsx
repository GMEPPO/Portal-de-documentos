import Link from "next/link";
import { FileText, Home, Shield } from "lucide-react";
import type { AppUser } from "@/lib/types";
import { LogoutButton } from "@/components/auth/logout-button";
import { AuthDebugger } from "@/components/debug/auth-debugger";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/documents", label: "Documentos", icon: FileText },
  { href: "/admin/users", label: "Administracao", icon: Shield },
] as const;

export function AppShell({
  user,
  children,
}: {
  user: AppUser;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="border-b border-slate-700 bg-slate-800/90">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <p className="font-semibold tracking-tight text-amber-400">DOCFLOW Internal</p>
          <nav className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <span>
              {user.name} · <span className="uppercase text-amber-300">{user.role}</span>
            </span>
            <span className="hidden text-xs text-slate-400 sm:inline">
              id: {user.id.slice(0, 8)}…
            </span>
            <AuthDebugger />
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
