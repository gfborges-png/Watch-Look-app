import { useMemo, useState } from 'react'
import { watches } from './data/watches.js'
import { getColorFilterGroup, getStyleTags } from './lib/outfitEngine.js'
import { DEFAULT_OUTFIT } from './lib/matchEngine.js'
import { getFavorites, toggleFavorite, getHistory, logWornToday, lastWornDate, recentlyWornIds } from './lib/storage.js'
import { getWeatherForCurrentLocation } from './lib/weather.js'
import WatchCard from './components/WatchCard.jsx'
import FilterBar, { Chip } from './components/FilterBar.jsx'
import WatchDetail from './components/WatchDetail.jsx'
import LookMatcher from './components/LookMatcher.jsx'

function App() {
  const [mode, setMode] = useState('colecao') // 'colecao' | 'look'
  const [query, setQuery] = useState('')
  const [colorFilter, setColorFilter] = useState('todos')
  const [styleFilter, setStyleFilter] = useState('todos')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [lookOutfit, setLookOutfit] = useState(DEFAULT_OUTFIT)
  const [lookContext, setLookContext] = useState('casual')
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

  const selectedWatch = useMemo(() => watches.find((w) => w.id === selectedId) ?? null, [selectedId])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return watches.filter((w) => {
      if (q && !w.nome.toLowerCase().includes(q)) return false
      if (colorFilter !== 'todos' && getColorFilterGroup(w.cor) !== colorFilter) return false
      if (styleFilter !== 'todos' && !getStyleTags(w.estilo).includes(styleFilter)) return false
      if (favoritesOnly && !favorites.includes(w.id)) return false
      return true
    })
  }, [query, colorFilter, styleFilter, favoritesOnly, favorites])

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
        />
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
            {mode === 'colecao'
              ? 'Escolha um relógio da coleção e veja sugestões de look combinando.'
              : 'Diga as cores do seu look e veja qual relógio da coleção combina.'}
          </p>

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
            <p className="mb-3 text-xs text-neutral-500">
              {filtered.length} {filtered.length === 1 ? 'relógio' : 'relógios'}
            </p>
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
