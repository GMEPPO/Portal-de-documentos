import { Button } from "@/components/ui/button";
import type { DocumentFileType } from "@/lib/types";

function isPdfFile(filename: string) {
  return filename.trim().toLowerCase().endsWith(".pdf");
}

function fileTypeLabel(fileType: DocumentFileType, filename: string) {
  if (fileType === "video") return "Vídeo";
  if (fileType === "audio") return "Áudio";
  if (isPdfFile(filename)) return "PDF";
  return "Documento";
}

function FileTile({
  fileUrl,
  filename,
  fileType,
}: {
  fileUrl: string;
  filename: string;
  fileType: DocumentFileType;
}) {
  const canEmbedPdf = fileType === "document" && isPdfFile(filename);
  const canEmbedVideo = fileType === "video";
  const canEmbedAudio = fileType === "audio";

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 rounded-lg border border-slate-700 bg-slate-900/50 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-100">{filename}</p>
          <p className="text-xs text-slate-400">{fileTypeLabel(fileType, filename)}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <a href={fileUrl} target="_blank" rel="noreferrer">Abrir</a>
          </Button>
          <Button asChild size="sm">
            <a href={fileUrl} target="_blank" rel="noreferrer" download>Descarregar</a>
          </Button>
        </div>
      </div>

      {canEmbedPdf ? (
        <iframe
          title={filename}
          src={fileUrl}
          className="h-[720px] w-full rounded-lg border border-slate-700 bg-white"
        />
      ) : canEmbedVideo ? (
        <video
          controls
          preload="metadata"
          className="w-full rounded-lg border border-slate-700 bg-black"
        >
          <source src={fileUrl} />
          O teu browser não suporta reprodução de vídeo.
        </video>
      ) : canEmbedAudio ? (
        <div className="rounded-lg border border-slate-700 bg-slate-950 p-6">
          <audio controls preload="metadata" className="w-full">
            <source src={fileUrl} />
            O teu browser não suporta reprodução de áudio.
          </audio>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-700 p-6 text-sm text-slate-400">
          Pré-visualização não disponível para este formato. Descarrega o ficheiro para o abrir.
        </div>
      )}
    </div>
  );
}

export function DocumentFileViewer({
  files,
}: {
  files: Array<{ fileUrl: string; filename: string; fileType: DocumentFileType }>;
}) {
  if (files.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-700 p-6 text-sm text-slate-400">
        Nenhum ficheiro disponível nesta versão.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {files.map((f, i) => (
        <FileTile key={i} fileUrl={f.fileUrl} filename={f.filename} fileType={f.fileType} />
      ))}
    </div>
  );
}
