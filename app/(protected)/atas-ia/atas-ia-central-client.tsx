"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
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
import {
  VALID_WORKSTREAMS,
  WORKSTREAM_LABELS,
  type WorkstreamId,
  type Contramedida,
} from "@/lib/workstream-atas";
import {
  generateAtaFieldsAction,
  saveAtaAction,
  listRecentAtasAction,
  type AtaRef,
} from "./actions";

const MAX_CHARS = 80_000;

const PROCESSING_STEPS = [
  "A analisar a transcrição da reunião…",
  "A ler a ata de referência do workstream…",
  "A identificar situação atual e progressos…",
  "A estruturar problemas e contramedidas…",
  "A redigir próximos passos e participantes…",
];

type Status = "idle" | "loading" | "review" | "saving" | "error";

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function AtasIaCentralClient() {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);

  const [workstream, setWorkstream] = useState<WorkstreamId>("ws1");
  const [meetingDate, setMeetingDate] = useState(today);
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [stepIndex, setStepIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [existingAtaId, setExistingAtaId] = useState<string | null>(null);

  // Atas de referência disponíveis para o WS selecionado
  const [recentAtas, setRecentAtas] = useState<AtaRef[]>([]);
  const [referenceAtaId, setReferenceAtaId] = useState<string | "none">("none");
  const [loadingRefs, setLoadingRefs] = useState(false);

  // Campos editáveis após geração
  const [situacaoAtual, setSituacaoAtual] = useState("");
  const [problemas, setProblemas] = useState("");
  const [contramedidas, setContramedidas] = useState<Contramedida[]>([]);
  const [proximosPassos, setProximosPassos] = useState("");
  const [participantes, setParticipantes] = useState("");

  const charCount = transcript.length;
  const isOverLimit = charCount > MAX_CHARS;
  const canSubmit = charCount >= 50 && !isOverLimit && Boolean(meetingDate);

  // Quando muda o workstream, vai buscar as últimas 5 atas para o seletor de referência
  useEffect(() => {
    setRecentAtas([]);
    setReferenceAtaId("none");
    setLoadingRefs(true);
    listRecentAtasAction(workstream).then((result) => {
      console.log("[AtasIA] listRecentAtasAction result:", result);
      if (result.ok && result.atas.length > 0) {
        setRecentAtas(result.atas);
        setReferenceAtaId(result.atas[0].id);
      }
      setLoadingRefs(false);
    }).catch((err) => {
      console.error("[AtasIA] listRecentAtasAction error:", err);
      setLoadingRefs(false);
    });
  }, [workstream]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setStatus("loading");
    setErrorMsg(null);
    setStepIndex(0);

    const interval = setInterval(() => {
      setStepIndex((prev) => (prev < PROCESSING_STEPS.length - 1 ? prev + 1 : prev));
    }, 8_000);

    const result = await generateAtaFieldsAction(
      workstream,
      meetingDate,
      transcript,
      referenceAtaId === "none" ? null : referenceAtaId,
    );
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
    setExistingAtaId(null);
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
      if (!result.ok && "existingId" in result && result.existingId) {
        setExistingAtaId(result.existingId);
      }
      setStatus("review");
    }
  }

  function reset() {
    setStatus("idle");
    setErrorMsg(null);
    setExistingAtaId(null);
    setTranscript("");
    setSituacaoAtual("");
    setProblemas("");
    setContramedidas([]);
    setProximosPassos("");
    setParticipantes("");
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
      {/* Passo 1 — Submissão */}
      {(status === "idle" || status === "loading") && (
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 space-y-4">

            {/* WS + Data na mesma linha */}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-slate-400">Workstream</span>
                <select
                  value={workstream}
                  onChange={(e) => setWorkstream(e.target.value as WorkstreamId)}
                  disabled={status === "loading"}
                  className="flex h-9 w-full rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-60"
                >
                  {VALID_WORKSTREAMS.map((ws) => (
                    <option key={ws} value={ws}>
                      {WORKSTREAM_LABELS[ws]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5">
                <span className="text-xs font-medium text-slate-400">Data da reunião</span>
                <Input
                  type="date"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  disabled={status === "loading"}
                  className="h-9"
                  required
                />
              </label>
            </div>

            {/* Ata de referência */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Ata de referência</span>
                {loadingRefs && (
                  <Loader2 className="h-3 w-3 animate-spin text-slate-500" />
                )}
              </div>

              {!loadingRefs && recentAtas.length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  Sem atas anteriores para este workstream — será gerado sem contexto.
                </p>
              ) : (
                <div className="relative">
                  <select
                    value={referenceAtaId}
                    onChange={(e) => setReferenceAtaId(e.target.value)}
                    disabled={status === "loading" || loadingRefs}
                    className="flex h-9 w-full appearance-none rounded-md border border-slate-700 bg-slate-900 px-3 pr-8 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-60"
                  >
                    <option value="none">Sem referência (gerar sem contexto)</option>
                    {recentAtas.map((ata) => {
                      const preview = ata.situacaoAtual
                        ? " · " + ata.situacaoAtual.split("\n")[0].slice(0, 60)
                        : "";
                      return (
                        <option key={ata.id} value={ata.id}>
                          {formatDate(ata.meetingDate)}{preview}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                </div>
              )}

              {referenceAtaId !== "none" && !loadingRefs && (
                <p className="text-[11px] text-slate-500">
                  O conteúdo desta ata será enviado ao agente IA como contexto da reunião anterior.
                </p>
              )}
            </div>

            {/* Transcrição */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <ScrollText className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-medium text-slate-400">Transcrição da reunião</span>
              </div>
              <Textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                disabled={status === "loading"}
                placeholder={`Cola aqui a transcrição da reunião…\n\nO agente IA irá:\n• Ler o contexto da ata de referência selecionada\n• Identificar situação atual e progressos\n• Listar problemas e bloqueios\n• Estruturar as contramedidas acordadas\n• Redigir os próximos passos`}
                className="min-h-[280px] resize-y text-sm leading-relaxed disabled:cursor-not-allowed disabled:opacity-60"
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
          </div>

          {/* Loading progress */}
          {status === "loading" && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-5 py-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 shrink-0 animate-spin text-amber-400" />
                <div>
                  <p className="text-sm font-medium text-amber-300">
                    A gerar ata para {WORKSTREAM_LABELS[workstream]}…
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">{PROCESSING_STEPS[stepIndex]}</p>
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
              Ata gerada para{" "}
              <strong>{WORKSTREAM_LABELS[workstream]}</strong>
              {" · "}
              <strong>{formatDate(meetingDate)}</strong>
              . Revê e edita antes de guardar.
            </p>
          </div>

          <SectionCard number="1" title="Situação atual" subtitle="Progresso face ao plano">
            <Textarea
              value={situacaoAtual}
              onChange={(e) => setSituacaoAtual(e.target.value)}
              className="min-h-[140px] resize-y text-sm"
              placeholder={"• Ponto 1\n• Ponto 2"}
              disabled={status === "saving"}
            />
          </SectionCard>

          <SectionCard number="2" title="Problemas identificados" subtitle="Desvios e bloqueios da semana">
            <Textarea
              value={problemas}
              onChange={(e) => setProblemas(e.target.value)}
              className="min-h-[140px] resize-y text-sm"
              placeholder={"• Problema 1\n• Problema 2"}
              disabled={status === "saving"}
            />
          </SectionCard>

          <SectionCard number="3" title="Contramedidas e decisões" subtitle="Ações acordadas, responsável e prazo">
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
                  <Input value={row.action} onChange={(e) => updateContramedida(i, "action", e.target.value)} placeholder="Ação a tomar" className="h-8 text-sm" disabled={status === "saving"} />
                  <Input value={row.owner} onChange={(e) => updateContramedida(i, "owner", e.target.value)} placeholder="Responsável" className="h-8 text-sm" disabled={status === "saving"} />
                  <Input value={row.deadline} onChange={(e) => updateContramedida(i, "deadline", e.target.value)} type="date" className="h-8 text-sm" disabled={status === "saving"} />
                  <button type="button" onClick={() => removeContramedida(i)} disabled={status === "saving"} className="flex h-8 w-8 items-center justify-center rounded text-slate-500 hover:text-red-400 transition-colors disabled:opacity-40">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={addContramedida} disabled={status === "saving"} className="mt-1 inline-flex items-center gap-1.5 rounded-md border border-dashed border-slate-600 px-3 py-1.5 text-xs text-slate-400 hover:border-slate-500 hover:text-slate-300 transition-colors disabled:opacity-40">
                <Plus className="h-3 w-3" />
                Adicionar ação
              </button>
            </div>
          </SectionCard>

          <SectionCard number="4" title="Próximos passos" subtitle="Foco para a semana seguinte">
            <Textarea
              value={proximosPassos}
              onChange={(e) => setProximosPassos(e.target.value)}
              className="min-h-[120px] resize-y text-sm"
              placeholder={"• Passo 1\n• Passo 2"}
              disabled={status === "saving"}
            />
          </SectionCard>

          <SectionCard number="5" title="Participantes" subtitle="">
            <Textarea
              value={participantes}
              onChange={(e) => setParticipantes(e.target.value)}
              className="min-h-[80px] resize-y text-sm"
              placeholder={"• Nome 1\n• Nome 2"}
              disabled={status === "saving"}
            />
          </SectionCard>

          {errorMsg && (
            <div className="flex items-start gap-3 rounded-lg border border-red-500/40 bg-red-500/5 px-4 py-3 text-sm">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <div className="flex-1">
                <p className="text-red-300">{errorMsg}</p>
                {existingAtaId && (
                  <Link
                    href={`/atas-ia/${workstream}/${existingAtaId}`}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 underline underline-offset-2"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Abrir ata existente
                  </Link>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleSave} disabled={status === "saving"} className="bg-amber-500 text-slate-900 hover:bg-amber-400 disabled:opacity-50">
              {status === "saving" ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />A guardar…</>
              ) : (
                <><ScrollText className="mr-2 h-4 w-4" />Guardar ata</>
              )}
            </Button>
            <button type="button" onClick={reset} disabled={status === "saving"} className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-40">
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
          <button type="button" onClick={reset} className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
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
