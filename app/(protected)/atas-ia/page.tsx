import { Suspense } from "react";
import { requireAuth } from "@/lib/auth";
import { listAllAtas } from "@/lib/workstream-atas";
import { Sparkles } from "lucide-react";
import { AtasIaCentralClient } from "./atas-ia-central-client";
import { AtasArquivoClient } from "./atas-arquivo-client";
import { AtasPageTabs } from "./atas-page-tabs";

export default async function AtasIaPage({
  searchParams,
}: {
  searchParams?: { tab?: string };
}) {
  await requireAuth();

  const activeTab = searchParams?.tab === "arquivo" ? "arquivo" : "nova";

  let allAtas: Awaited<ReturnType<typeof listAllAtas>> = [];
  try {
    allAtas = await listAllAtas(500);
  } catch {
    allAtas = [];
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Atas com IA</h1>
          <p className="mt-1 text-sm text-slate-400">
            Gera atas estruturadas a partir de transcrições e consulta o arquivo completo.
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-500/60 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
          <Sparkles className="h-3 w-3" />
          IA
        </span>
      </div>

      {/* Tabs (client component para gerir URL) */}
      <AtasPageTabs activeTab={activeTab} totalAtas={allAtas.length} />

      {/* Conteúdo da tab activa */}
      {activeTab === "nova" ? (
        <AtasIaCentralClient />
      ) : (
        <Suspense fallback={<p className="text-sm text-slate-500">A carregar arquivo…</p>}>
          <AtasArquivoClient atas={allAtas} />
        </Suspense>
      )}
    </div>
  );
}
