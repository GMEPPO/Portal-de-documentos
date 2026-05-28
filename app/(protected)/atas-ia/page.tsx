import { requireAuth } from "@/lib/auth";
import { listAllAtas, WORKSTREAM_LABELS } from "@/lib/workstream-atas";
import { Sparkles, ScrollText, Clock } from "lucide-react";
import { AtasIaCentralClient } from "./atas-ia-central-client";
import Link from "next/link";

export default async function AtasIaPage() {
  await requireAuth();

  let allAtas: Awaited<ReturnType<typeof listAllAtas>> = [];
  try {
    allAtas = await listAllAtas(50);
  } catch {
    allAtas = [];
  }

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Atas com IA</h1>
          <p className="mt-1 text-sm text-slate-400">
            Cola a transcrição da reunião, seleciona o workstream e a data — o agente IA gera a ata estruturada automaticamente.
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-500/60 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
          <Sparkles className="h-3 w-3" />
          IA
        </span>
      </div>

      {/* Formulário central */}
      <AtasIaCentralClient />

      {/* Histórico */}
      {allAtas.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Histórico de atas
          </h2>
          <div className="divide-y divide-slate-800 rounded-xl border border-slate-700 bg-slate-800/30 overflow-hidden">
            {allAtas.map((ata) => (
              <Link
                key={ata.id}
                href={`/atas-ia/${ata.workstream}/${ata.id}`}
                className="flex items-center gap-4 px-4 py-3 hover:bg-slate-800/60 transition-colors"
              >
                <ScrollText className="h-4 w-4 shrink-0 text-amber-400" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-200">
                      {WORKSTREAM_LABELS[ata.workstream]}
                    </span>
                    <span className="text-xs text-slate-500">·</span>
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="h-3 w-3" />
                      {new Date(ata.meetingDate + "T00:00:00").toLocaleDateString("pt-PT", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  {ata.situacaoAtual && (
                    <p className="mt-0.5 text-xs text-slate-500 truncate leading-relaxed">
                      {ata.situacaoAtual.split("\n")[0]}
                    </p>
                  )}
                </div>
                <span className="shrink-0 rounded-full bg-slate-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                  {ata.workstream.toUpperCase()}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
