import { useMemo, useState } from 'react'
import { watches } from './data/watches.js'
import { getColorFilterGroup, getStyleTags } from './lib/outfitEngine.js'
import WatchCard from './components/WatchCard.jsx'
import FilterBar from './components/FilterBar.jsx'
import WatchDetail from './components/WatchDetail.jsx'

function App() {
  const [query, setQuery] = useState('')
  const [colorFilter, setColorFilter] = useState('todos')
  const [styleFilter, setStyleFilter] = useState('todos')
  const [selectedId, setSelectedId] = useState(null)

  const selectedWatch = useMemo(() => watches.find((w) => w.id === selectedId) ?? null, [selectedId])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return watches.filter((w) => {
      if (q && !w.nome.toLowerCase().includes(q)) return false
      if (colorFilter !== 'todos' && getColorFilterGroup(w.cor) !== colorFilter) return false
      if (styleFilter !== 'todos' && !getStyleTags(w.estilo).includes(styleFilter)) return false
      return true
    })
  }, [query, colorFilter, styleFilter])

  if (selectedWatch) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100">
        <WatchDetail watch={selectedWatch} onBack={() => setSelectedId(null)} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="sticky top-0 z-10 border-b border-white/5 bg-neutral-950/90 px-4 pb-4 pt-6 backdrop-blur">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-xl font-bold tracking-tight">
            Watch <span className="text-amber-400">&amp;</span> Look
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Escolha um relógio da coleção e veja sugestões de look combinando.
          </p>
          <div className="mt-4">
            <FilterBar
              query={query}
              onQueryChange={setQuery}
              colorFilter={colorFilter}
              onColorChange={setColorFilter}
              styleFilter={styleFilter}
              onStyleChange={setStyleFilter}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-5">
        <p className="mb-3 text-xs text-neutral-500">
          {filtered.length} {filtered.length === 1 ? 'relógio' : 'relógios'}
        </p>
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-neutral-500">
            Nenhum relógio encontrado com esses filtros.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filtered.map((w) => (
              <WatchCard key={w.id} watch={w} onClick={() => setSelectedId(w.id)} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default App
