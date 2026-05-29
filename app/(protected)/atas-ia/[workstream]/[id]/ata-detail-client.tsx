"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Edit3,
  ExternalLink,
  FileDown,
  Loader2,
  Plus,
  RotateCcw,
  ScrollText,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import type { WorkstreamAtaRecord, Contramedida } from "@/lib/workstream-atas";
import { updateAtaAction, deleteAtaAction } from "./actions";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function AtaDetailClient({
  ata,
  workstreamLabel,
  locale,
  initialSuccess,
  isAdmin = false,
}: {
  ata: WorkstreamAtaRecord;
  workstreamLabel: string;
  locale: string;
  initialSuccess?: boolean;
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(initialSuccess ?? false);

  // Estado do modal de eliminação
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    const result = await deleteAtaAction(ata.id, ata.workstream);
    setDeleting(false);
    if (result.ok) {
      router.push("/atas-ia");
      router.refresh();
    } else {
      setDeleteError(result.error);
    }
  }

  // Campos editáveis
  const [situacaoAtual, setSituacaoAtual] = useState(ata.situacaoAtual);
  const [problemas, setProblemas] = useState(ata.problemasIdentificados);
  const [contramedidas, setContramedidas] = useState<Contramedida[]>(ata.contramedidas);
  const [proximosPassos, setProximosPassos] = useState(ata.proximosPassos);
  const [participantes, setParticipantes] = useState(ata.participantes);

  function cancelEdit() {
    setIsEditing(false);
    setSaveError(null);
    // Repõe os valores originais da prop
    setSituacaoAtual(ata.situacaoAtual);
    setProblemas(ata.problemasIdentificados);
    setContramedidas(ata.contramedidas);
    setProximosPassos(ata.proximosPassos);
    setParticipantes(ata.participantes);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    const result = await updateAtaAction(
      ata.id,
      ata.workstream,
      situacaoAtual,
      problemas,
      contramedidas,
      proximosPassos,
      participantes,
    );
    setSaving(false);
    if (result.ok) {
      setIsEditing(false);
      setSaved(true);
      router.refresh(); // re-fetch para actualizar dados no servidor
    } else {
      setSaveError(result.error);
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

  const dateFormatted = new Date(ata.meetingDate + "T00:00:00").toLocaleDateString(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href={`/atas-ia/${ata.workstream}`}>&larr; {workstreamLabel}</Link>
        </Button>
        <h1 className="text-xl font-semibold text-slate-100 capitalize">{dateFormatted}</h1>
        {!isEditing && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setIsEditing(true); setSaved(false); }}
              className="border-slate-600"
            >
              <Edit3 className="mr-1.5 h-3.5 w-3.5" />
              Editar
            </Button>
            <a
              href={`/api/atas-ia/${ata.id}/pdf`}
              download
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-600 bg-transparent px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-slate-100 transition-colors"
            >
              <FileDown className="h-3.5 w-3.5" />
              Download PDF
            </a>
            {ata.documentId && (
              <Link
                href={`/documents/${ata.documentId}`}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-600 bg-transparent px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-slate-100 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Ver documento
              </Link>
            )}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-red-500/40 bg-transparent px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Eliminar
              </button>
            )}
          </>
        )}
      </div>

      {/* Feedback de guardado */}
      {saved && !isEditing && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-500/40 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Ata atualizada com sucesso.
        </div>
      )}

      {/* Modo edição */}
      {isEditing ? (
        <div className="space-y-6">
          <SectionCard number="1" title="Situação atual" subtitle="Progresso face ao plano">
            <Textarea
              value={situacaoAtual}
              onChange={(e) => setSituacaoAtual(e.target.value)}
              className="min-h-[140px] resize-y text-sm"
              disabled={saving}
            />
          </SectionCard>

          <SectionCard number="2" title="Problemas identificados" subtitle="Desvios e bloqueios da semana">
            <Textarea
              value={problemas}
              onChange={(e) => setProblemas(e.target.value)}
              className="min-h-[140px] resize-y text-sm"
              disabled={saving}
            />
          </SectionCard>

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
                    placeholder="Ação"
                    className="h-8 text-sm"
                    disabled={saving}
                  />
                  <Input
                    value={row.owner}
                    onChange={(e) => updateContramedida(i, "owner", e.target.value)}
                    placeholder="Owner"
                    className="h-8 text-sm"
                    disabled={saving}
                  />
                  <Input
                    value={row.deadline}
                    onChange={(e) => updateContramedida(i, "deadline", e.target.value)}
                    type="date"
                    className="h-8 text-sm"
                    disabled={saving}
                  />
                  <button
                    type="button"
                    onClick={() => removeContramedida(i)}
                    disabled={saving}
                    className="flex h-8 w-8 items-center justify-center rounded text-slate-500 hover:text-red-400 transition-colors disabled:opacity-40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addContramedida}
                disabled={saving}
                className="mt-1 inline-flex items-center gap-1.5 rounded-md border border-dashed border-slate-600 px-3 py-1.5 text-xs text-slate-400 hover:border-slate-500 hover:text-slate-300 transition-colors disabled:opacity-40"
              >
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
              disabled={saving}
            />
          </SectionCard>

          <SectionCard number="5" title="Participantes" subtitle="">
            <Textarea
              value={participantes}
              onChange={(e) => setParticipantes(e.target.value)}
              className="min-h-[80px] resize-y text-sm"
              disabled={saving}
            />
          </SectionCard>

          {saveError && (
            <div className="flex items-start gap-3 rounded-lg border border-red-500/40 bg-red-500/5 px-4 py-3 text-sm">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <p className="text-red-300">{saveError}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-amber-500 text-slate-900 hover:bg-amber-400 disabled:opacity-50"
            >
              {saving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />A guardar…</>
              ) : (
                <><ScrollText className="mr-2 h-4 w-4" />Guardar alterações</>
              )}
            </Button>
            <button
              type="button"
              onClick={cancelEdit}
              disabled={saving}
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-40"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        // Modo visualização
        <div className="space-y-6">
          <SectionView number="1" title="Situação atual" subtitle="Progresso face ao plano" content={situacaoAtual} />
          <SectionView number="2" title="Problemas identificados" subtitle="Desvios e bloqueios da semana" content={problemas} />

          {/* Contramedidas — tabela de visualização */}
          <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-4 space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-400">
                  3
                </span>
                <h3 className="text-sm font-semibold text-slate-200">Contramedidas e decisões</h3>
              </div>
              <p className="mt-0.5 pl-7 text-xs text-slate-500">Ações acordadas na reunião, responsável e prazo</p>
            </div>
            {contramedidas.length === 0 ? (
              <p className="pl-7 text-sm text-slate-500">Sem ações registadas.</p>
            ) : (
              <div className="space-y-1 overflow-x-auto">
                <div className="grid min-w-[520px] grid-cols-[1fr_160px_140px] gap-2 px-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <span>Ação</span>
                  <span>Owner</span>
                  <span>Prazo</span>
                </div>
                {contramedidas.map((row, i) => (
                  <div
                    key={i}
                    className="grid min-w-[520px] grid-cols-[1fr_160px_140px] gap-2 rounded border border-slate-700 px-3 py-2 text-sm"
                  >
                    <span className="text-slate-200">{row.action || "—"}</span>
                    <span className="text-slate-300">{row.owner || "—"}</span>
                    <span className="text-slate-400">
                      {row.deadline
                        ? new Date(row.deadline + "T00:00:00").toLocaleDateString(locale)
                        : "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <SectionView number="4" title="Próximos passos" subtitle="Foco para a semana seguinte" content={proximosPassos} />
          <SectionView number="5" title="Participantes" subtitle="" content={participantes} />
        </div>
      )}

      {/* ── Modal de eliminação ── */}
      <Dialog open={deleteOpen} onOpenChange={(v) => { if (!deleting) setDeleteOpen(v); }}>
        <DialogContent className="max-w-md border-red-500/30 bg-slate-900 p-0">
          <div className="p-6 space-y-4">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-100">Eliminar ata permanentemente</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Esta ação é <span className="font-semibold text-red-400">irreversível</span> e não pode ser desfeita.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm">
              <p className="mb-2 font-medium text-slate-200">Ao confirmar, serão eliminados permanentemente:</p>
              <ul className="space-y-1.5 text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0 text-red-400">•</span>
                  Esta ata e todo o seu conteúdo ({workstreamLabel} · {dateFormatted})
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0 text-red-400">•</span>
                  O documento associado em "Atas de Reunião"
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0 text-red-400">•</span>
                  Todos os PDFs gerados (todas as versões)
                </li>
              </ul>
            </div>

            {deleteError && (
              <div className="flex items-start gap-2 rounded border border-red-500/40 bg-red-500/5 px-3 py-2 text-xs text-red-300">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {deleteError}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDeleteOpen(false)}
                disabled={deleting}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />A eliminar…</>
                ) : (
                  <><Trash2 className="mr-2 h-4 w-4" />Eliminar permanentemente</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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

function SectionView({
  number,
  title,
  subtitle,
  content,
}: {
  number: string;
  title: string;
  subtitle: string;
  content: string;
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
      {content ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{content}</p>
      ) : (
        <p className="text-sm text-slate-500 italic">—</p>
      )}
    </div>
  );
}
