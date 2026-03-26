import { Button } from "@/components/ui/button";

function isPdfFile(url: string) {
  return url.toLowerCase().includes(".pdf");
}

export function DocumentFileViewer({
  fileUrl,
  filename,
}: {
  fileUrl: string;
  filename: string;
}) {
  const pdf = isPdfFile(filename);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border border-slate-700 bg-slate-900/50 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-100">Documento principal</p>
          <p className="text-xs text-slate-400">
            {pdf
              ? "Leitura embebida na web. PDFs e Word convertidos para PDF podem ser pesquisados com Ctrl+F."
              : "Este formato pode ser aberto numa nova aba para consulta."}
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

      {pdf ? (
        <iframe
          title="Visualizacao do documento"
          src={fileUrl}
          className="h-[720px] w-full rounded-lg border border-slate-700 bg-white"
        />
      ) : (
        <div className="rounded-lg border border-dashed border-slate-700 p-6 text-sm text-slate-400">
          Este tipo de ficheiro ainda nao tem preview embebido. Usa "Abrir documento" para consultar o conteudo.
        </div>
      )}
    </div>
  );
}
