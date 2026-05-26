import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { getLastAtasForAllWorkstreams, WORKSTREAM_LABELS, VALID_WORKSTREAMS } from "@/lib/workstream-atas";
import { ScrollText, Sparkles, Plus, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getLocale } from "@/lib/i18n";

export default async function AtasIaPage() {
  await requireAuth();
  const locale = getLocale();

  let lastAtas: Awaited<ReturnType<typeof getLastAtasForAllWorkstreams>>;
  try {
    lastAtas = await getLastAtasForAllWorkstreams();
  } catch {
    lastAtas = { ws1: null, ws2: null, ws3: null, ws4: null };
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Atas com IA</h1>
          <p className="mt-1 text-sm text-slate-400">
            Cola a transcrição da reunião e o agente IA gera automaticamente a ata estruturada.
            O contexto da ata anterior é usado para enriquecer a geração.
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-500/60 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
          <Sparkles className="h-3 w-3" />
          IA
        </span>
      </div>

      {/* Cards por workstream */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {VALID_WORKSTREAMS.map((ws) => {
          const last = lastAtas[ws];
          return (
            <Card key={ws} className="border-slate-700 bg-slate-800/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-slate-100">{WORKSTREAM_LABELS[ws]}</CardTitle>
                  <ScrollText className="h-4 w-4 text-amber-400" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock className="h-3 w-3" />
                  {last
                    ? `Última: ${new Date(last.meetingDate).toLocaleDateString(locale, {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}`
                    : "Sem atas registadas"}
                </div>
                {last && (
                  <p className="line-clamp-2 text-xs text-slate-500 leading-relaxed">
                    {last.situacaoAtual.split("\n")[0] || "—"}
                  </p>
                )}
                <div className="flex flex-col gap-2 pt-1">
                  <Button
                    asChild
                    size="sm"
                    className="w-full bg-amber-500 text-slate-900 hover:bg-amber-400"
                  >
                    <Link href={`/atas-ia/${ws}/nova`}>
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Nova ata
                    </Link>
                  </Button>
                  {last && (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <Link href={`/atas-ia/${ws}`}>Ver histórico</Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Rodapé informativo */}
      <div className="rounded-lg border border-slate-700/60 bg-slate-800/30 px-4 py-3">
        <p className="text-xs text-slate-500 leading-relaxed">
          <span className="font-medium text-slate-400">Como funciona:</span> cola a transcrição da reunião no
          formulário do workstream correspondente. O agente IA lê o contexto da ata anterior e
          pré-preenche automaticamente os 5 campos — situação atual, problemas identificados,
          contramedidas, próximos passos e participantes. Revê, edita e guarda.
        </p>
      </div>
    </div>
  );
}
