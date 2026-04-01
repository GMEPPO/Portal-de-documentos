import { Button } from "@/components/ui/button";
import type { DocumentFileType } from "@/lib/types";

export function DocumentFileViewer({
  fileUrl,
  filename,
  fileType,
}: {
  fileUrl: string;
  filename: string;
  fileType: DocumentFileType;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border border-slate-700 bg-slate-900/50 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-100">Documento principal</p>
          <p className="text-xs text-slate-400">
            {fileType === "document"
              ? "Leitura embebida na web. Para procurar texto no PDF, usa Ctrl+F na visualizacao."
              : fileType === "video"
                ? "Reproducao embebida do video na web com controles nativos."
                : "Reproducao embebida do audio na web com controles nativos."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <a href={fileUrl} target="_blank" rel="noreferrer">
              Abrir documento
            </a>
          </Button>
          <Button asChild>
            <a href={fileUrl} target="_blank" rel="noreferrer" download>
              Transferir
            </a>
          </Button>
        </div>
      </div>

      {fileType === "document" ? (
        <iframe
          title={`Visualizacao de ${filename}`}
          src={fileUrl}
          className="h-[720px] w-full rounded-lg border border-slate-700 bg-white"
        />
      ) : fileType === "video" ? (
        <video
          controls
          preload="metadata"
          className="w-full rounded-lg border border-slate-700 bg-black"
        >
          <source src={fileUrl} />
          O navegador nao consegue reproduzir este video embebido.
        </video>
      ) : fileType === "audio" ? (
        <div className="rounded-lg border border-slate-700 bg-slate-950 p-6">
          <audio controls preload="metadata" className="w-full">
            <source src={fileUrl} />
            O navegador nao consegue reproduzir este audio embebido.
          </audio>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-700 p-6 text-sm text-slate-400">
          Este tipo de ficheiro ainda nao tem preview embebido. Usa "Abrir documento" para consultar o conteudo.
        </div>
      )}
    </div>
  );
}
