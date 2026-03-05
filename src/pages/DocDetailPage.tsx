import { useParams, Link } from 'react-router-dom'
import { getDocumentById } from '@/data/mockDocuments'
import { StatusBadge } from '@/components/StatusBadge'

export function DocDetailPage() {
  const { id } = useParams<{ id: string }>()
  const doc = id ? getDocumentById(id) : undefined

  if (!doc) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
        <p className="font-medium">Documento no encontrado</p>
        <p className="text-sm mt-1">El ID &quot;{id}&quot; no existe en el catálogo.</p>
        <Link to="/" className="mt-4 inline-block text-primary-600 font-medium hover:underline">
          ← Volver a búsqueda
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
        <Link to={`/processes/${doc.processName}`} className="hover:text-primary-600">{doc.processName}</Link>
        <span>/</span>
        <span className="text-slate-700">{doc.id}</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="font-mono text-sm text-slate-500">{doc.id}</span>
            <StatusBadge status={doc.status} />
            <span className="text-sm text-slate-500">Versión {doc.version}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{doc.title}</h1>
          <p className="mt-2 text-slate-600">{doc.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {doc.tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          <div className="p-4 sm:p-6">
            <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">Autor</dt>
            <dd className="mt-1 font-medium text-slate-800">{doc.author}</dd>
          </div>
          <div className="p-4 sm:p-6">
            <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">Proceso</dt>
            <dd className="mt-1">
              <Link to={`/processes/${doc.processName}`} className="font-medium text-primary-600 hover:underline">
                {doc.processName}
              </Link>
            </dd>
          </div>
          <div className="p-4 sm:p-6">
            <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">Categoría</dt>
            <dd className="mt-1 font-medium text-slate-800">{doc.category}</dd>
          </div>
          <div className="p-4 sm:p-6">
            <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">Actualizado</dt>
            <dd className="mt-1 font-medium text-slate-800">{doc.updatedAt}</dd>
          </div>
        </dl>

        <div className="px-6 sm:px-8 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-3">
          <span className="text-sm text-slate-500">Creado: {doc.createdAt}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <Link
          to={`/processes/${doc.processName}`}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-slate-200 text-slate-800 font-medium hover:bg-slate-300 transition"
        >
          Ver proceso
        </Link>
        <Link
          to="/"
          className="inline-flex items-center px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition"
        >
          Buscar más documentos
        </Link>
      </div>
    </div>
  )
}
