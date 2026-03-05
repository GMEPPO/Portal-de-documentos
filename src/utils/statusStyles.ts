import type { DocStatus } from '@/data/mockDocuments'

export function statusBadgeClass(status: DocStatus): string {
  const base = 'shrink-0 inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium'
  const map: Record<DocStatus, string> = {
    'Borrador': `${base} bg-amber-100 text-amber-800`,
    'En revisión': `${base} bg-blue-100 text-blue-800`,
    'Aprobado': `${base} bg-emerald-100 text-emerald-800`,
    'Archivado': `${base} bg-slate-100 text-slate-600`,
    'Rechazado': `${base} bg-red-100 text-red-800`,
  }
  return map[status] ?? base
}
