"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
  RotateCcw,
  ScrollText,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { generateAtaFieldsAction, saveAtaAction } from "./actions";
import type { WorkstreamId, Contramedida } from "@/lib/workstream-atas";

const MAX_CHARS = 80_000;

const PROCESSING_STEPS = [
  "A analisar a transcrição da reunião…",
  "A ler a ata anterior do workstream…",
  "A identificar situação atual e progressos…",
  "A estruturar problemas e contramedidas…",
  "A redigir próximos passos e participantes…",
];

type Status = "idle" | "loading" | "review" | "saving" | "error";

type GeneratedFields = {
  situacaoAtual: string;
  problemasIdentificados: string;
  contramedidas: Contramedida[];
  proximosPassos: string;
  participantes: string;
};

export function NovaAtaClient({
  workstream,
  workstreamLabel,
}: {
  workstream: WorkstreamId;
  workstreamLabel: string;
}) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);

  const [transcript, setTranscript] = useState("");
  const [meetingDate, setMeetingDate] = useState(today);
  const [status, setStatus] = useState<Status>("idle");
  const [stepIndex, setStepIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Campos editáveis após geração IA
  const [situacaoAtual, setSituacaoAtual] = useState("");
  const [problemas, setProblemas] = useState("");
  const [contramedidas, setContramedidas] = useState<Contramedida[]>([]);
  const [proximosPassos, setProximosPassos] = useState("");
  const [participantes, setParticipantes] = useState("");

  const charCount = transcript.length;
  const isOverLimit = charCount > MAX_CHARS;
  const canSubmit = charCount >= 50 && !isOverLimit && Boolean(meetingDate);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setStatus("loading");
    setErrorMsg(null);
    setStepIndex(0);

    const interval = setInterval(() => {
      setStepIndex((prev) => (prev < PROCESSING_STEPS.length - 1 ? prev + 1 : prev));
    }, 8_000);

    const result = await generateAtaFieldsAction(workstream, meetingDate, transcript);
    clearInterval(interval);

    if (result.ok) {
      setSituacaoAtual(result.situacaoAtual);
      setProblemas(result.problemasIdentificados);
      setContramedidas(result.contramedidas);
      setProximosPassos(result.proximosPassos);
      setParticipantes(result.participantes);
      setStatus("review");
    } else {
      setErrorMsg(result.error);
      setStatus("error");
    }
  }

  async function handleSave() {
    setStatus("saving");
    const result = await saveAtaAction(
      workstream,
      meetingDate,
      transcript,
      situacaoAtual,
      problemas,
      contramedidas,
      proximosPassos,
      participantes,
    );
    if (result.ok) {
      router.push(`/atas-ia/${workstream}/${result.id}?saved=1`);
    } else {
      setErrorMsg(result.error);
      setStatus("review");
    }
  }

  function addContramedida() {
    setContramedidas((prev) => [...prev, { action: "", owner: "", deadline: "" }]);
  }

  function removeContramedida(i: number) {
    setContramedidas((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateContramedida(i: number, field: keyof Contramedida, value: string) {
    setContramedidas((prev) =>
      prev.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)),
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href={`/atas-ia/${workstream}`}>&larr; {workstreamLabel}</Link>
        </Button>
        <h1 className="text-xl font-semibold text-slate-100">Nova ata</h1>
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/60 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-amber-400">
          <Sparkles className="h-3 w-3" />
          IA
        </span>
      </div>

      {/* Passo 1 — Transcrição */}
      {(status === "idle" || status === "loading") && (
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <ScrollText className="h-4 w-4 text-amber-400" />
              <p className="text-sm font-medium text-slate-200">Transcrição da reunião</p>
            </div>

            <label className="block space-y-1.5">
              <span className="text-xs text-slate-400">Data da reunião</span>
              <Input
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                disabled={status === "loading"}
                className="h-9 w-52"
                required
              />
            </label>

            <Textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              disabled={status === "loading"}
              placeholder={`Cola aqui a transcrição da reunião de ${workstreamLabel}…\n\nO agente IA irá:\n• Ler o contexto da ata anterior\n• Identificar a situação atual e progressos\n• Listar problemas e bloqueios\n• Estruturar as contramedidas acordadas\n• Redigir os próximos passos`}
              className="min-h-[300px] resize-y text-sm leading-relaxed disabled:cursor-not-allowed disabled:opacity-60"
            />

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Mínimo 50 caracteres</span>
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

          {status === "loading" && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-5 py-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 shrink-0 animate-spin text-amber-400" />
                <div>
                  <p className="text-sm font-medium text-amber-300">A gerar a ata…</p>
                  <p className="mt-0.5 text-xs text-slate-400 transition-all">
                    {PROCESSING_STEPS[stepIndex]}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                O processo pode demorar entre 30 segundos e 2 minutos. Não feches esta página.
              </p>
            </div>
          )}

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
                <Sparkles className="mr-2 h-4 w-4" />
                Gerar ata com IA
              </>
            )}
          </Button>
        </form>
      )}

      {/* Passo 2 — Revisão e edição */}
      {(status === "review" || status === "saving") && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <p className="text-sm text-emerald-300">
              Ata gerada pelo agente IA para{" "}
              <strong>
                {new Date(meetingDate + "T00:00:00").toLocaleDateString("pt-PT", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </strong>
              . Revê e edita antes de guardar.
            </p>
          </div>

          {/* 1 — Situação atual */}
          <SectionCard number="1" title="Situação atual" subtitle="Progresso face ao plano">
            <Textarea
              value={situacaoAtual}
              onChange={(e) => setSituacaoAtual(e.target.value)}
              className="min-h-[140px] resize-y text-sm"
              placeholder={"• Ponto 1\n• Ponto 2"}
              disabled={status === "saving"}
            />
          </SectionCard>

          {/* 2 — Problemas identificados */}
          <SectionCard
            number="2"
            title="Problemas identificados"
            subtitle="Desvios e bloqueios da semana"
          >
            <Textarea
              value={problemas}
              onChange={(e) => setProblemas(e.target.value)}
              className="min-h-[140px] resize-y text-sm"
              placeholder={"• Problema 1\n• Problema 2"}
              disabled={status === "saving"}
            />
          </SectionCard>

          {/* 3 — Contramedidas e decisões */}
          <SectionCard
            number="3"
            title="Contramedidas e decisões"
            subtitle="Ações acordadas na reunião, responsável e prazo"
          >
            <div className="space-y-2">
              {contramedidas.length > 0 && (
                <div className="grid grid-cols-[1fr_140px_140px_32px] gap-2 px-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <span>Ação</span>
                  <span>Owner</span>
                  <span>Prazo</span>
                  <span />
                </div>
              )}
              {contramedidas.map((row, i) => (
                <div key={i} className="grid grid-cols-[1fr_140px_140px_32px] gap-2 items-center">
                  <Input
                    value={row.action}
                    onChange={(e) => updateContramedida(i, "action", e.target.value)}
                    placeholder="Ação a tomar"
                    className="h-8 text-sm"
                    disabled={status === "saving"}
                  />
                  <Input
                    value={row.owner}
                    onChange={(e) => updateContramedida(i, "owner", e.target.value)}
                    placeholder="Responsável"
                    className="h-8 text-sm"
                    disabled={status === "saving"}
                  />
                  <Input
                    value={row.deadline}
                    onChange={(e) => updateContramedida(i, "deadline", e.target.value)}
                    type="date"
                    className="h-8 text-sm"
                    disabled={status === "saving"}
                  />
                  <button
                    type="button"
                    onClick={() => removeContramedida(i)}
                    disabled={status === "saving"}
                    className="flex h-8 w-8 items-center justify-center rounded text-slate-500 hover:text-red-400 transition-colors disabled:opacity-40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addContramedida}
                disabled={status === "saving"}
                className="mt-1 inline-flex items-center gap-1.5 rounded-md border border-dashed border-slate-600 px-3 py-1.5 text-xs text-slate-400 hover:border-slate-500 hover:text-slate-300 transition-colors disabled:opacity-40"
              >
                <Plus className="h-3 w-3" />
                Adicionar ação
              </button>
            </div>
          </SectionCard>

          {/* 4 — Próximos passos */}
          <SectionCard
            number="4"
            title="Próximos passos"
            subtitle="Foco para a semana seguinte"
          >
            <Textarea
              value={proximosPassos}
              onChange={(e) => setProximosPassos(e.target.value)}
              className="min-h-[120px] resize-y text-sm"
              placeholder={"• Passo 1\n• Passo 2"}
              disabled={status === "saving"}
            />
          </SectionCard>

          {/* 5 — Participantes */}
          <SectionCard number="5" title="Participantes" subtitle="">
            <Textarea
              value={participantes}
              onChange={(e) => setParticipantes(e.target.value)}
              className="min-h-[80px] resize-y text-sm"
              placeholder={"• Nome 1\n• Nome 2"}
              disabled={status === "saving"}
            />
          </SectionCard>

          {/* Erro ao guardar */}
          {errorMsg && (
            <div className="flex items-start gap-3 rounded-lg border border-red-500/40 bg-red-500/5 px-4 py-3 text-sm">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <p className="text-red-300">{errorMsg}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={handleSave}
              disabled={status === "saving"}
              className="bg-amber-500 text-slate-900 hover:bg-amber-400 disabled:opacity-50"
            >
              {status === "saving" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  A guardar…
                </>
              ) : (
                <>
                  <ScrollText className="mr-2 h-4 w-4" />
                  Guardar ata
                </>
              )}
            </Button>
            <button
              type="button"
              onClick={() => { setStatus("idle"); setErrorMsg(null); }}
              disabled={status === "saving"}
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-40"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Recomeçar
            </button>
          </div>
        </div>
      )}

      {/* Erro na geração */}
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
            onClick={() => { setStatus("idle"); setErrorMsg(null); }}
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Tentar novamente
          </button>
        </div>
      )}
    </div>
  );
}

function SectionCard({
  number,
  title,
  subtitle,
  children,
}: {
  number: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-4 space-y-3">
      <div>
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-400">
            {number}
          </span>
          <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
        </div>
        {subtitle && <p className="mt-0.5 pl-7 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
