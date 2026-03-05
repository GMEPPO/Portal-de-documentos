import type { DocStatus } from '@/data/mockDocuments'

const statusStyles: Record<DocStatus, string> = {
  'Aprobado': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'En revisión': 'bg-amber-100 text-amber-800 border-amber-200',
  'Borrador': 'bg-slate-100 text-slate-700 border-slate-200',
  'Archivado': 'bg-slate-200 text-slate-600 border-slate-300',
  'Rechazado': 'bg-red-100 text-red-800 border-red-200',
}

interface StatusBadgeProps {
  status: DocStatus
  className?: string
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyles[status]} ${className}`}
    >
      {status}
    </span>
  )
}
