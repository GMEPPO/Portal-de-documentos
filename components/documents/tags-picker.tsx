"use client";

import { cn } from "@/lib/utils";

export function TagsPicker({
  availableTags,
  selectedTags,
  onChange,
  className,
  labels,
}: {
  availableTags: string[];
  selectedTags: string[];
  onChange: (next: string[]) => void;
  className?: string;
  labels: { title: string; hint: string };
}) {
  const normalizedSelected = new Set(selectedTags);

  return (
    <div className={cn("space-y-2", className)}>
      <div>
        <p className="text-sm text-slate-300">{labels.title}</p>
        <p className="text-xs text-slate-400">{labels.hint}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {availableTags.map((tag) => {
          const active = normalizedSelected.has(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => {
                const next = new Set(normalizedSelected);
                if (active) next.delete(tag);
                else next.add(tag);
                onChange(Array.from(next).sort((a, b) => a.localeCompare(b)));
              }}
              className={cn(
                "rounded-full border px-3 py-1 text-xs",
                active
                  ? "border-amber-300/40 bg-amber-300/10 text-amber-100"
                  : "border-slate-700 bg-slate-900/40 text-slate-300 hover:bg-slate-800/40",
              )}
            >
              {tag}
            </button>
          );
        })}
        {availableTags.length === 0 ? (
          <span className="text-xs text-slate-500">—</span>
        ) : null}
      </div>
    </div>
  );
}

