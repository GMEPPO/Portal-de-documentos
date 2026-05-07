"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DocumentFileType } from "@/lib/types";

function isPdfFile(filename: string) {
  return filename.trim().toLowerCase().endsWith(".pdf");
}

function canEmbed(fileType: DocumentFileType, filename: string) {
  if (fileType === "video") return "video";
  if (fileType === "audio") return "audio";
  if (fileType === "document" && isPdfFile(filename)) return "pdf";
  return null;
}

export type ReaderFile = { fileUrl: string; filename: string; fileType: DocumentFileType };

export function DocumentReaderSplit({
  files,
  className,
  labels,
}: {
  files: ReaderFile[];
  className?: string;
  labels: {
    empty: string;
    listTitle: string;
    listDescription: string;
    open: string;
    download: string;
    noPreview: string;
  };
}) {
  const initialIndex = 0;
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);

  const safeFiles = files.filter((f) => Boolean(f.fileUrl));
  const selected = useMemo(
    () => safeFiles[Math.min(Math.max(selectedIndex, 0), Math.max(safeFiles.length - 1, 0))],
    [safeFiles, selectedIndex],
  );

  if (safeFiles.length === 0) {
    return (
      <div className={cn("rounded-lg border border-dashed border-slate-700 p-6 text-sm text-slate-400", className)}>
        {labels.empty}
      </div>
    );
  }

  const embed = selected ? canEmbed(selected.fileType, selected.filename) : null;

  return (
    <div className={cn("grid gap-4 lg:grid-cols-2", className)}>
      <div className="rounded-lg border border-slate-700 bg-slate-900/30 p-4">
        <p className="text-sm font-medium text-slate-100">{labels.listTitle}</p>
        <p className="mt-1 text-xs text-slate-400">{labels.listDescription}</p>
        <div className="mt-3 space-y-1">
          {safeFiles.map((f, idx) => (
            <button
              key={`${f.filename}-${idx}`}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2 text-left text-xs",
                idx === selectedIndex
                  ? "border-slate-500 bg-slate-800/60 text-slate-100"
                  : "border-slate-700 bg-slate-900/40 text-slate-300 hover:bg-slate-800/40",
              )}
            >
              <span className="truncate">{f.filename}</span>
              <span className="shrink-0 text-[10px] uppercase tracking-wide text-slate-400">
                {f.fileType}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-3 rounded-lg border border-slate-700 bg-slate-900/50 p-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-100">{selected.filename}</p>
            <p className="text-xs text-slate-400">{selected.fileType}</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <a href={selected.fileUrl} target="_blank" rel="noreferrer">{labels.open}</a>
            </Button>
            <Button asChild size="sm">
              <a href={selected.fileUrl} target="_blank" rel="noreferrer" download>{labels.download}</a>
            </Button>
          </div>
        </div>

        {embed === "pdf" ? (
          <iframe
            title={selected.filename}
            src={selected.fileUrl}
            className="h-[720px] w-full rounded-lg border border-slate-700 bg-white"
          />
        ) : embed === "video" ? (
          <video
            controls
            preload="metadata"
            className="w-full rounded-lg border border-slate-700 bg-black"
          >
            <source src={selected.fileUrl} />
            O teu browser não suporta reprodução de vídeo.
          </video>
        ) : embed === "audio" ? (
          <div className="rounded-lg border border-slate-700 bg-slate-950 p-6">
            <audio controls preload="metadata" className="w-full">
              <source src={selected.fileUrl} />
              O teu browser não suporta reprodução de áudio.
            </audio>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-700 p-6 text-sm text-slate-400">
            {labels.noPreview}
          </div>
        )}
      </div>
    </div>
  );
}

