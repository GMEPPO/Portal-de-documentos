"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DocumentFilePicker({
  onFileChange,
  className,
}: {
  onFileChange: (file: File | null) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  function pickFile(file: File | null) {
    setFileName(file?.name ?? null);
    onFileChange(file);
  }

  return (
    <div className={cn(className, "space-y-3")}>
      <div
        className={cn(
          "flex items-center justify-between gap-3 rounded-lg border border-dashed border-slate-700 bg-slate-800/40 p-4",
          isDragging && "border-amber-400/80 bg-amber-400/10",
        )}
        onDragEnter={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files?.[0] ?? null;
          pickFile(file);
        }}
      >
        <div className="min-w-0">
          <p className="text-sm font-medium">Adjuntar ficheiro</p>
          <p className="text-xs text-slate-400">
            Arrasta y suelta aquí o selecciona un fichero
          </p>
          {fileName && (
            <p className="mt-2 truncate text-xs text-slate-300">{fileName}</p>
          )}
        </div>

        <div className="shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
          >
            Buscar
          </Button>
        </div>

        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            pickFile(file);
          }}
        />
      </div>

      {fileName && (
        <Button
          type="button"
          variant="ghost"
          className="h-8 px-2 text-xs text-slate-300 hover:text-white"
          onClick={() => pickFile(null)}
        >
          Remover ficheiro
        </Button>
      )}
    </div>
  );
}

