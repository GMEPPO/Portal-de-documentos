"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DocumentFilePicker({
  onFilesChange,
  className,
  labels,
}: {
  onFilesChange: (files: File[]) => void;
  className?: string;
  labels?: {
    attach: string;
    helper: string;
    browse: string;
    remove: string;
  };
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  function addFiles(incoming: File[]) {
    const merged = [...files, ...incoming].filter(
      (f, i, arr) => arr.findIndex((x) => x.name === f.name) === i,
    );
    setFiles(merged);
    onFilesChange(merged);
  }

  function removeFile(name: string) {
    const updated = files.filter((f) => f.name !== name);
    setFiles(updated);
    onFilesChange(updated);
  }

  return (
    <div className={cn(className, "space-y-3")}>
      <div
        className={cn(
          "flex items-center justify-between gap-3 rounded-lg border border-dashed border-slate-700 bg-slate-800/40 p-4",
          isDragging && "border-amber-400/80 bg-amber-400/10",
        )}
        onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          addFiles(Array.from(e.dataTransfer.files));
        }}
      >
        <div className="min-w-0">
          <p className="text-sm font-medium">{labels?.attach ?? "Adjuntar ficheiros"}</p>
          <p className="text-xs text-slate-400">
            {labels?.helper ?? "Arrasta e larga aqui ou clica em Adicionar. Formatos: PDF, Word, MP4, MP3, M4A"}
          </p>
        </div>
        <div className="shrink-0">
          <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
            {labels?.browse ?? "Adicionar"}
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.mp4,.webm,.mp3,.m4a,.wav"
          className="hidden"
          onChange={(e) => {
            addFiles(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
      </div>

      {files.length > 0 && (
        <ul className="space-y-1">
          {files.map((file) => (
            <li
              key={file.name}
              className="flex items-center justify-between gap-2 rounded-md border border-slate-700 bg-slate-800/30 px-3 py-2 text-xs text-slate-300"
            >
              <span className="truncate">{file.name}</span>
              <Button
                type="button"
                variant="ghost"
                className="h-6 px-2 text-xs text-slate-400 hover:text-white"
                onClick={() => removeFile(file.name)}
              >
                {labels?.remove ?? "Remover"}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
