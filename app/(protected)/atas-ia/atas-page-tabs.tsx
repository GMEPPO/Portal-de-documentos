"use client";

import Link from "next/link";
import { Archive, Plus } from "lucide-react";

export function AtasPageTabs({
  activeTab,
  totalAtas,
}: {
  activeTab: "nova" | "arquivo";
  totalAtas: number;
}) {
  const base = "inline-flex items-center gap-2 border-b-2 px-4 pb-3 pt-1 text-sm font-medium transition-colors";
  const active = "border-amber-500 text-amber-400";
  const inactive = "border-transparent text-slate-400 hover:border-slate-600 hover:text-slate-300";

  return (
    <div className="flex border-b border-slate-700">
      <Link
        href="/atas-ia"
        className={`${base} ${activeTab === "nova" ? active : inactive}`}
      >
        <Plus className="h-4 w-4" />
        Nova ata
      </Link>
      <Link
        href="/atas-ia?tab=arquivo"
        className={`${base} ${activeTab === "arquivo" ? active : inactive}`}
      >
        <Archive className="h-4 w-4" />
        Arquivo
        {totalAtas > 0 && (
          <span className="rounded-full bg-slate-700 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
            {totalAtas}
          </span>
        )}
      </Link>
    </div>
  );
}
