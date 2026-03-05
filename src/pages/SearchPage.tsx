import { useState, useMemo } from 'react'
import { searchDocuments } from '@/data/mockDocuments'
import { DocCard } from '@/components/DocCard'

export function SearchPage() {
  const [query, setQuery] = useState('')
  const results = useMemo(() => searchDocuments(query), [query])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Buscar documentos</h1>
        <p className="text-slate-600 mt-1">Busca por título, autor, etiquetas o ID.</p>
      </div>

      <div className="relative">
        <input
          type="search"
          placeholder="Escribe para buscar..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-4 pr-10 text-slate-800 placeholder-slate-400 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden>
          🔍
        </span>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          {results.length} documento{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results.map(doc => (
          <DocCard key={doc.id} doc={doc} />
        ))}
      </div>

      {results.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center text-slate-500">
          No hay documentos que coincidan con la búsqueda.
        </div>
      )}
    </div>
  )
}
