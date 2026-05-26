"use client";

import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  RotateCcw,
  ScrollText,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generateAtaAction } from "./actions";

const MAX_CHARS = 80_000;

const PROCESSING_STEPS = [
  "A analisar o texto da reunião…",
  "A identificar participantes e pontos de agenda…",
  "A estruturar os tópicos discutidos…",
  "A redigir a ata no formato oficial…",
  "A gerar o ficheiro PDF…",
];

type Status = "idle" | "loading" | "done" | "error";

export function AtasIaClient() {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);

  const charCount = text.length;
  const isOverLimit = charCount > MAX_CHARS;
  const canSubmit = charCount >= 20 && !isOverLimit;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setStatus("loading");
    setErrorMsg(null);
    setDownloadUrl(null);
    setStepIndex(0);

    // Avança os passos de processamento visualmente enquanto espera
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev < PROCESSING_STEPS.length - 1 ? prev + 1 : prev));
    }, 8_000);

    const result = await generateAtaAction(text);

    clearInterval(interval);

    if (result.ok) {
      setDownloadUrl(result.url);
      setStatus("done");
    } else {
      setErrorMsg(result.error);
      setStatus("error");
    }
  }

  function handleReset() {
    setStatus("idle");
    setText("");
    setDownloadUrl(null);
    setErrorMsg(null);
    setStepIndex(0);
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Atas com IA</h1>
          <p className="mt-1 text-sm text-slate-400">
            Cola as notas da reunião e o agente IA gera automaticamente uma ata em PDF no formato
            oficial.
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-500/60 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
          <Sparkles className="h-3 w-3" />
          IA
        </span>
      </div>

      {/* Estado: idle ou loading — formulário */}
      {(status === "idle" || status === "loading") && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-amber-400" />
              <p className="text-sm font-medium text-slate-200">Notas da reunião</p>
            </div>

            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={status === "loading"}
              placeholder={`Cola aqui as notas da reunião — pode incluir:\n• Lista de participantes\n• Pontos discutidos\n• Decisões tomadas\n• Próximos passos e responsáveis\n• Data, local e duração`}
              className="min-h-[320px] resize-y text-sm leading-relaxed disabled:cursor-not-allowed disabled:opacity-60"
            />

            {/* Contador de caracteres */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Mínimo 20 caracteres · máximo {MAX_CHARS.toLocaleString()} caracteres
              </span>
              <span
                className={
                  isOverLimit
                    ? "font-semibold text-red-400"
                    : charCount > MAX_CHARS * 0.9
                      ? "text-amber-400"
                      : "text-slate-500"
                }
              >
                {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Loading state */}
          {status === "loading" && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-5 py-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 shrink-0 animate-spin text-amber-400" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-amber-300">A gerar a ata…</p>
                  <p className="mt-0.5 text-xs text-slate-400 transition-all">
                    {PROCESSING_STEPS[stepIndex]}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                O processo pode demorar entre 30 segundos e 2 minutos consoante o tamanho do texto.
                Não feches esta página.
              </p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={!canSubmit || status === "loading"}
              className="bg-amber-500 text-slate-900 hover:bg-amber-400 disabled:opacity-40"
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  A gerar…
                </>
              ) : (
                <>
                  <ScrollText className="mr-2 h-4 w-4" />
                  Gerar Ata
                </>
              )}
            </Button>

            {status === "idle" && text.length > 0 && (
              <button
                type="button"
                onClick={() => setText("")}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Limpar
              </button>
            )}
          </div>
        </form>
      )}

      {/* Estado: done — resultado */}
      {status === "done" && downloadUrl && (
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 px-6 py-5">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-emerald-300">Ata gerada com sucesso!</p>
                <p className="mt-1 text-sm text-slate-400">
                  O agente IA processou as notas e gerou a ata no formato oficial. Clica em
                  descarregar para obter o PDF.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <a href={downloadUrl} target="_blank" rel="noopener noreferrer" download>
                <Button className="bg-emerald-600 hover:bg-emerald-500 text-white">
                  <Download className="mr-2 h-4 w-4" />
                  Descarregar PDF
                </Button>
              </a>

              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-slate-400 hover:text-slate-200 underline underline-offset-4 transition-colors"
              >
                Abrir em nova aba
              </a>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Gerar nova ata
          </button>
        </div>
      )}

      {/* Estado: error */}
      {status === "error" && errorMsg && (
        <div className="space-y-4">
          <div className="rounded-xl border border-red-500/40 bg-red-500/5 px-5 py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
              <div>
                <p className="font-medium text-red-300">Não foi possível gerar a ata</p>
                <p className="mt-1 text-sm text-slate-400">{errorMsg}</p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStatus("idle")}
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Tentar novamente
          </button>
        </div>
      )}

      {/* Rodapé informativo */}
      {status === "idle" && (
        <div className="rounded-lg border border-slate-700/60 bg-slate-800/30 px-4 py-3">
          <p className="text-xs text-slate-500 leading-relaxed">
            <span className="font-medium text-slate-400">Como funciona:</span> o texto é enviado
            para um agente IA que identifica os elementos da reunião (participantes, agenda, decisões
            e próximos passos) e redige a ata num formato estruturado e padronizado, devolvendo um
            ficheiro PDF pronto a ser partilhado e arquivado.
          </p>
        </div>
      )}
    </div>
  );
}
