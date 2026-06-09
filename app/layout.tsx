import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { getLocale } from "@/lib/i18n";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const locale = getLocale();

  return locale === "es"
    ? {
        title: "Gestão Documental",
        description: "Gestión documental empresarial con control de acceso y versiones.",
      }
    : {
        title: "Gestão Documental",
        description: "Gestão documental empresarial com controlo de acesso e versões.",
      };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = getLocale();

  return (
    <html lang={locale} className="dark">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
