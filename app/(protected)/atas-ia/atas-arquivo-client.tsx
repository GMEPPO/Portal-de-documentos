"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  ExternalLink,
  FileDown,
  Search,
  ScrollText,
  X,
} from "lucide-react";
import { WORKSTREAM_LABELS, VALID_WORKSTREAMS, type WorkstreamAtaRecord, type WorkstreamId } from "@/lib/workstream-atas";

const WS_COLORS: Record<WorkstreamId, string> = {
  ws1:      "border-blue-500/40 bg-blue-500/10 text-blue-300",
  ws2:      "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  ws3:      "border-violet-500/40 bg-violet-500/10 text-violet-300",
  ws4:      "border-rose-500/40 bg-rose-500/10 text-rose-300",
  steering: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  ps:       "border-cyan-500/40 bg-cyan-500/10 text-cyan-300",
};

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function WsBadge({ ws }: { ws: WorkstreamId }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${WS_COLORS[ws]}`}
    >
      {ws === "steering" ? "Steering" : ws === "ps" ? "PS" : ws.toUpperCase()}
    </span>
  );
}

export function AtasArquivoClient({ atas }: { atas: WorkstreamAtaRecord[] }) {
  const [search, setSearch]           = useState("");
  const [wsFilter, setWsFilter]       = useState<WorkstreamId | "all">("all");
  const [dateFrom, setDateFrom]       = useState("");
  const [dateTo, setDateTo]           = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return atas.filter((a) => {
      if (wsFilter !== "all" && a.workstream !== wsFilter) return false;
      if (dateFrom && a.meetingDate < dateFrom) return false;
      if (dateTo   && a.meetingDate > dateTo)   return false;
      if (q) {
        const haystack = [
          WORKSTREAM_LABELS[a.workstream],
          a.situacaoAtual,
          a.problemasIdentificados,
          a.proximosPassos,
          a.participantes,
        ].join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [atas, search, wsFilter, dateFrom, dateTo]);

  const hasFilters = search || wsFilter !== "all" || dateFrom || dateTo;

  function clearFilters() {
    setSearch("");
    setWsFilter("all");
    setDateFrom("");
    setDateTo("");
  }

  return (
    <div className="space-y-4">

      {/* ── Barra de filtros ─────────────────────────────────────── */}
      <div className="flex flex-col gap-3">

        {/* Pesquisa de texto */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar em todas as atas…"
            className="w-full rounded-lg border border-slate-700 bg-slate-800/60 py-2 pl-9 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:border-amber-500/60 focus:outline-none focus:ring-0"
          />
        </div>

        {/* Filtros: workstream + datas */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Pills de workstream */}
          <button
            onClick={() => setWsFilter("all")}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              wsFilter === "all"
                ? "border-amber-500 bg-amber-500/20 text-amber-300"
                : "border-slate-700 bg-transparent text-slate-400 hover:border-slate-500 hover:text-slate-300"
            }`}
          >
            Todos
          </button>
          {VALID_WORKSTREAMS.map((ws) => (
            <button
              key={ws}
              onClick={() => setWsFilter(wsFilter === ws ? "all" : ws)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                wsFilter === ws
                  ? WS_COLORS[ws]
                  : "border-slate-700 bg-transparent text-slate-400 hover:border-slate-500 hover:text-slate-300"
              }`}
            >
              {WORKSTREAM_LABELS[ws]}
            </button>
          ))}

          {/* Separador */}
          <span className="text-slate-700">|</span>

          {/* De */}
          <label className="flex items-center gap-1.5 text-xs text-slate-500">
            <Calendar className="h-3.5 w-3.5" />
            De:
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs text-slate-300 focus:border-amber-500/60 focus:outline-none"
            />
          </label>

          {/* Até */}
          <label className="flex items-center gap-1.5 text-xs text-slate-500">
            Até:
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs text-slate-300 focus:border-amber-500/60 focus:outline-none"
            />
          </label>

          {/* Limpar filtros */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto flex items-center gap-1 rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400 hover:border-slate-500 hover:text-slate-300 transition-colors"
            >
              <X className="h-3 w-3" />
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* ── Contador de resultados ───────────────────────────────── */}
      <p className="text-xs text-slate-500">
        {filtered.length === atas.length
          ? `${atas.length} atas`
          : `${filtered.length} de ${atas.length} atas`}
      </p>

      {/* ── Lista / Tabela ───────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/30 py-12 text-center">
          <ScrollText className="h-8 w-8 text-slate-600" />
          <p className="text-sm text-slate-500">Nenhuma ata corresponde aos filtros aplicados.</p>
          {hasFilters && (
            <button onClick={clearFilters} className="mt-1 text-xs text-amber-400 hover:underline">
              Limpar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-700">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Workstream</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Situação atual</th>
                <th className="px-4 py-3">Participantes</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map((ata) => {
                const firstLine = ata.situacaoAtual?.split("\n")[0]?.trim() || "—";
                const participantList = ata.participantes
                  ? ata.participantes.split("\n").map((p) => p.replace(/^•\s*/, "").trim()).filter(Boolean)
                  : [];

                return (
                  <tr
                    key={ata.id}
                    className="bg-slate-800/20 hover:bg-slate-800/60 transition-colors"
                  >
                    {/* Workstream */}
                    <td className="px-4 py-3">
                      <WsBadge ws={ata.workstream} />
                    </td>

                    {/* Data */}
                    <td className="px-4 py-3 whitespace-nowrap text-slate-300">
                      {formatDate(ata.meetingDate)}
                    </td>

                    {/* Situação atual */}
                    <td className="px-4 py-3 max-w-xs">
                      <p className="truncate text-slate-400" title={firstLine}>
                        {firstLine}
                      </p>
                    </td>

                    {/* Participantes */}
                    <td className="px-4 py-3 max-w-[200px]">
                      {participantList.length === 0 ? (
                        <span className="text-slate-600">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {participantList.slice(0, 3).map((p, i) => (
                            <span
                              key={i}
                              className="rounded bg-slate-700/60 px-1.5 py-0.5 text-[11px] text-slate-300"
                            >
                              {p}
                            </span>
                          ))}
                          {participantList.length > 3 && (
                            <span className="text-[11px] text-slate-500">
                              +{participantList.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Ações */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/atas-ia/${ata.workstream}/${ata.id}`}
                          className="inline-flex items-center gap-1 rounded border border-slate-600 px-2 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700 hover:text-slate-100 transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Ver
                        </Link>
                        <a
                          href={`/api/atas-ia/${ata.id}/pdf`}
                          download
                          className="inline-flex items-center gap-1 rounded border border-slate-600 px-2 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700 hover:text-slate-100 transition-colors"
                        >
                          <FileDown className="h-3 w-3" />
                          PDF
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
