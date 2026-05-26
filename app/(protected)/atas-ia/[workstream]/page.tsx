import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import {
  listAtasForWorkstream,
  VALID_WORKSTREAMS,
  WORKSTREAM_LABELS,
  type WorkstreamId,
} from "@/lib/workstream-atas";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getLocale } from "@/lib/i18n";

export default async function WorkstreamAtasPage({
  params,
}: {
  params: { workstream: string };
}) {
  if (!VALID_WORKSTREAMS.includes(params.workstream as WorkstreamId)) notFound();
  const workstream = params.workstream as WorkstreamId;

  await requireAuth();
  const locale = getLocale();

  let atas: Awaited<ReturnType<typeof listAtasForWorkstream>> = [];
  try {
    atas = await listAtasForWorkstream(workstream);
  } catch {
    /* mostra vazio */
  }

  const label = WORKSTREAM_LABELS[workstream];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/atas-ia">&larr; Atas IA</Link>
          </Button>
          <h1 className="text-xl font-semibold text-slate-100">{label}</h1>
        </div>
        <Button asChild size="sm" className="bg-amber-500 text-slate-900 hover:bg-amber-400">
          <Link href={`/atas-ia/${workstream}/nova`}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Nova ata
          </Link>
        </Button>
      </div>

      {atas.length === 0 ? (
        <div className="rounded-lg border border-slate-700 bg-slate-800/30 px-4 py-10 text-center">
          <p className="text-sm text-slate-400">Sem atas registadas para este workstream.</p>
          <p className="mt-2 text-xs text-slate-500">Clica em "Nova ata" para criar a primeira.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {atas.map((ata) => (
            <Link
              key={ata.id}
              href={`/atas-ia/${workstream}/${ata.id}`}
              className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/40 px-4 py-3 hover:bg-slate-800/70 transition-colors group"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-100 group-hover:text-amber-300 transition-colors">
                  {new Date(ata.meetingDate).toLocaleDateString(locale, {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                {ata.situacaoAtual && (
                  <p className="mt-0.5 truncate text-xs text-slate-400">
                    {ata.situacaoAtual.split("\n")[0]}
                  </p>
                )}
              </div>
              <span className="ml-4 shrink-0 text-xs text-slate-500">
                {new Date(ata.meetingDate).toLocaleDateString(locale)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
