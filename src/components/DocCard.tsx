import { Link } from 'react-router-dom'
import type { MockDocument } from '@/data/mockDocuments'
import { StatusBadge } from './StatusBadge'

interface DocCardProps {
  doc: MockDocument
}

export function DocCard({ doc }: DocCardProps) {
  return (
    <Link
      to={`/docs/${doc.id}`}
      className="block bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-primary-200 transition-all duration-200 p-5 group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="text-xs font-mono text-slate-500">{doc.id}</span>
          <h3 className="mt-1 font-semibold text-slate-800 group-hover:text-primary-600 truncate">
            {doc.title}
          </h3>
          <p className="mt-1.5 text-sm text-slate-600 line-clamp-2">{doc.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge status={doc.status} />
            <span className="text-xs text-slate-500">v{doc.version}</span>
            {doc.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <span className="text-slate-400 group-hover:text-primary-500 shrink-0">→</span>
      </div>
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>{doc.author}</span>
        <span>Actualizado: {doc.updatedAt}</span>
      </div>
    </Link>
  )
}
