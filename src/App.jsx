import { useMemo, useState } from 'react'
import { getColorFilterGroup, getStyleTags } from './lib/outfitEngine.js'
import { DEFAULT_OUTFIT } from './lib/matchEngine.js'
import {
  getCollection,
  addWatch,
  updateWatch,
  deleteWatch,
  resetCollection,
  exportData,
  importData,
  getFavorites,
  toggleFavorite,
  getHistory,
  logWornToday,
  lastWornDate,
  recentlyWornIds,
} from './lib/storage.js'
import { getWeatherForCurrentLocation } from './lib/weather.js'
import WatchCard from './components/WatchCard.jsx'
import FilterBar, { Chip } from './components/FilterBar.jsx'
import WatchDetail from './components/WatchDetail.jsx'
import LookMatcher from './components/LookMatcher.jsx'
import WatchForm from './components/WatchForm.jsx'
import BackupPanel from './components/BackupPanel.jsx'

function App() {
  const [mode, setMode] = useState('colecao') // 'colecao' | 'look'
  const [query, setQuery] = useState('')
  const [colorFilter, setColorFilter] = useState('todos')
  const [styleFilter, setStyleFilter] = useState('todos')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [formTarget, setFormTarget] = useState(null) // null | 'new' | watchId
  const [showBackup, setShowBackup] = useState(false)
  const [lookOutfit, setLookOutfit] = useState(DEFAULT_OUTFIT)
  const [lookContext, setLookContext] = useState('casual')
  const [collection, setCollection] = useState(() => getCollection())
  const [favorites, setFavorites] = useState(() => getFavorites())
  const [history, setHistory] = useState(() => getHistory())
  const [weather, setWeather] = useState({ status: 'idle' })

  const recentIds = useMemo(() => recentlyWornIds(history), [history])

  const handleToggleFavorite = (id) => setFavorites(toggleFavorite(id))
  const handleLogWornToday = (id) => setHistory(logWornToday(id))

  const handleFetchWeather = async () => {
    setWeather({ status: 'loading' })
    try {
      const result = await getWeatherForCurrentLocation()
      setWeather({ status: 'ready', ...result })
    } catch (err) {
      setWeather({ status: 'error', error: err.message })
    }
  }

  const handleSaveWatch = (data) => {
    const next = formTarget === 'new' ? addWatch(data) : updateWatch(formTarget, data)
    setCollection(next)
    setFormTarget(null)
  }

  const handleDeleteWatch = (id) => {
    if (!window.confirm('Remover esse relógio da coleção?')) return
    setCollection(deleteWatch(id))
    setSelectedId(null)
    setFormTarget(null)
  }

  const handleResetCollection = () => setCollection(resetCollection())

  const handleImportFile = async (file) => {
    const text = await file.text()
    const data = JSON.parse(text)
    importData(data)
    setCollection(getCollection())
    setFavorites(getFavorites())
    setHistory(getHistory())
  }

  const selectedWatch = useMemo(() => collection.find((w) => w.id === selectedId) ?? null, [collection, selectedId])
  const editingWatch = useMemo(
    () => (formTarget && formTarget !== 'new' ? collection.find((w) => w.id === formTarget) ?? null : null),
    [collection, formTarget],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return collection.filter((w) => {
      if (q && !w.nome.toLowerCase().includes(q)) return false
      if (colorFilter !== 'todos' && getColorFilterGroup(w.cor) !== colorFilter) return false
      if (styleFilter !== 'todos' && !getStyleTags(w.estilo).includes(styleFilter)) return false
      if (favoritesOnly && !favorites.includes(w.id)) return false
      return true
    })
  }, [collection, query, colorFilter, styleFilter, favoritesOnly, favorites])

  if (formTarget !== null) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100">
        <WatchForm
          mode={formTarget === 'new' ? 'new' : 'edit'}
          initialWatch={editingWatch}
          onSave={handleSaveWatch}
          onCancel={() => setFormTarget(null)}
          onDelete={() => handleDeleteWatch(formTarget)}
        />
      </div>
    )
  }

  if (showBackup) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100">
        <BackupPanel
          onBack={() => setShowBackup(false)}
          onExport={exportData}
          onImportFile={handleImportFile}
          onResetCollection={handleResetCollection}
          watchCount={collection.length}
        />
      </div>
    )
  }

  if (selectedWatch) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100">
        <WatchDetail
          watch={selectedWatch}
          onBack={() => setSelectedId(null)}
          isFavorite={favorites.includes(selectedWatch.id)}
          onToggleFavorite={() => handleToggleFavorite(selectedWatch.id)}
          lastWorn={lastWornDate(selectedWatch.id, history)}
          onLogWornToday={() => handleLogWornToday(selectedWatch.id)}
          onEdit={() => setFormTarget(selectedWatch.id)}
          onDelete={() => handleDeleteWatch(selectedWatch.id)}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="sticky top-0 z-10 border-b border-white/5 bg-neutral-950/90 px-4 pb-4 pt-6 backdrop-blur">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Watch <span className="text-amber-400">&amp;</span> Look
              </h1>
              <p className="mt-1 text-sm text-neutral-400">
                {mode === 'colecao'
                  ? 'Escolha um relógio da coleção e veja sugestões de look combinando.'
                  : 'Diga as cores do seu look e veja qual relógio da coleção combina.'}
              </p>
            </div>
            <button
              onClick={() => setShowBackup(true)}
              aria-label="Dados e backup"
              className="shrink-0 rounded-full border border-white/10 bg-white/5 p-2 text-neutral-400 transition hover:bg-white/10 hover:text-neutral-100"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>

          <div className="mt-4 flex gap-2">
            <Chip active={mode === 'colecao'} onClick={() => setMode('colecao')}>
              Relógio → Look
            </Chip>
            <Chip active={mode === 'look'} onClick={() => setMode('look')}>
              Look → Relógio
            </Chip>
          </div>

          {mode === 'colecao' && (
            <div className="mt-4">
              <FilterBar
                query={query}
                onQueryChange={setQuery}
                colorFilter={colorFilter}
                onColorChange={setColorFilter}
                styleFilter={styleFilter}
                onStyleChange={setStyleFilter}
                favoritesOnly={favoritesOnly}
                onFavoritesOnlyChange={setFavoritesOnly}
              />
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-5">
        {mode === 'look' ? (
          <LookMatcher
            watches={collection}
            onSelectWatch={setSelectedId}
            outfit={lookOutfit}
            onOutfitChange={setLookOutfit}
            context={lookContext}
            onContextChange={setLookContext}
            recentIds={recentIds}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            weather={weather}
            onFetchWeather={handleFetchWeather}
          />
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs text-neutral-500">
                {filtered.length} {filtered.length === 1 ? 'relógio' : 'relógios'}
              </p>
              <button
                onClick={() => setFormTarget('new')}
                className="shrink-0 rounded-full bg-amber-400 px-3 py-1.5 text-xs font-semibold text-neutral-950 transition hover:bg-amber-300"
              >
                + Adicionar relógio
              </button>
            </div>
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-neutral-500">
                {favoritesOnly ? 'Você ainda não favoritou nenhum relógio.' : 'Nenhum relógio encontrado com esses filtros.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {filtered.map((w) => (
                  <WatchCard
                    key={w.id}
                    watch={w}
                    onClick={() => setSelectedId(w.id)}
                    isFavorite={favorites.includes(w.id)}
                    onToggleFavorite={() => handleToggleFavorite(w.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default App
