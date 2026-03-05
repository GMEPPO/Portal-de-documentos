import { useParams, Link } from 'react-router-dom'
import { getDocumentsByProcess, processes } from '@/data/mockDocuments'
import { DocCard } from '@/components/DocCard'

export function ProcessDetailPage() {
  const { processName } = useParams<{ processName: string }>()
  const process = processName ? processes.find(p => p.name === processName) : undefined
  const docs = processName ? getDocumentsByProcess(processName) : []

  if (!process) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
        <p className="font-medium">Proceso no encontrado</p>
        <p className="text-sm mt-1">El proceso &quot;{processName}&quot; no existe.</p>
        <Link to="/processes" className="mt-4 inline-block text-primary-600 font-medium hover:underline">
          ← Volver a procesos
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/" className="hover:text-primary-600">Buscar</Link>
        <span>/</span>
        <Link to="/processes" className="hover:text-primary-600">Procesos</Link>
        <span>/</span>
        <span className="text-slate-700">{process.displayName}</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-slate-100 text-slate-700 border-slate-200">
            {process.category}
          </span>
          <span className="text-sm text-slate-500">{process.documentCount} documentos</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">{process.displayName}</h1>
        <p className="mt-2 text-slate-600">{process.description}</p>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Documentos del proceso</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map(doc => (
            <DocCard key={doc.id} doc={doc} />
          ))}
        </div>
      </div>

      <Link
        to="/processes"
        className="inline-flex items-center text-primary-600 font-medium hover:underline"
      >
        ← Volver a procesos
      </Link>
    </div>
  )
}
