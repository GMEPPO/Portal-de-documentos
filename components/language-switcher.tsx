"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import type { Locale } from "@/lib/types";

export function LanguageSwitcher({
  currentLocale,
  options,
  ariaLabel,
}: {
  currentLocale: Locale;
  options: Array<{ value: Locale; label: string }>;
  ariaLabel: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  return (
    <select
      aria-label={ariaLabel}
      className="h-9 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100"
      value={currentLocale}
      disabled={isPending}
      onChange={(event) => {
        const locale = event.target.value as Locale;
        startTransition(async () => {
          await fetch("/api/locale", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ locale }),
          });

          const query = searchParams.toString();
          router.replace(query ? `${pathname}?${query}` : pathname);
          router.refresh();
        });
      }}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
