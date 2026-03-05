import { Link } from 'react-router-dom'
import { processes } from '@/data/mockDocuments'

const categoryColors: Record<string, string> = {
  Contratos: 'bg-blue-100 text-blue-800 border-blue-200',
  RRHH: 'bg-violet-100 text-violet-800 border-violet-200',
  Finanzas: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Legal: 'bg-amber-100 text-amber-800 border-amber-200',
  Operaciones: 'bg-sky-100 text-sky-800 border-sky-200',
  Calidad: 'bg-teal-100 text-teal-800 border-teal-200',
}

export function ProcessesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Procesos</h1>
        <p className="text-slate-600 mt-1">Explora los procesos y sus documentos asociados.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {processes.map(p => (
          <Link
            key={p.name}
            to={`/processes/${p.name}`}
            className="block bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-primary-200 transition-all duration-200 p-6 group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    categoryColors[p.category] ?? 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {p.category}
                </span>
                <h2 className="mt-3 font-semibold text-slate-800 group-hover:text-primary-600">
                  {p.displayName}
                </h2>
                <p className="mt-1.5 text-sm text-slate-600 line-clamp-2">{p.description}</p>
                <p className="mt-3 text-sm font-medium text-slate-500">
                  {p.documentCount} documento{p.documentCount !== 1 ? 's' : ''}
                </p>
              </div>
              <span className="text-slate-400 group-hover:text-primary-500 shrink-0">→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
