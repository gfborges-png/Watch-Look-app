import { useMemo, useState } from 'react'
import { getColorFilterGroup } from './lib/outfitEngine.js'
import { inferWatchTypes, inferBraceletMaterial } from './lib/watchModel.js'
import { sortCollection } from './lib/collectionSort.js'
import { exportData, importData, lastWornDate } from './lib/storage.js'
import { DEFAULT_OUTFIT } from './lib/matchEngine.js'
import { useWatchCollection } from './hooks/useWatchCollection.js'
import { useWardrobe } from './hooks/useWardrobe.js'
import { useRecommendationHistory } from './hooks/useRecommendationHistory.js'
import { useWeather } from './hooks/useWeather.js'
import { usePreferences } from './hooks/usePreferences.js'
import WatchCard from './components/WatchCard.jsx'
import FilterBar from './components/FilterBar.jsx'
import ForgottenWatches from './components/ForgottenWatches.jsx'
import WatchDetail from './components/WatchDetail.jsx'
import LookMatcher from './components/LookMatcher.jsx'
import WatchForm from './components/WatchForm.jsx'
import BackupPanel from './components/BackupPanel.jsx'
import WardrobePanel from './components/WardrobePanel.jsx'
import TodayScreen from './components/TodayScreen.jsx'
import BottomNav from './components/BottomNav.jsx'

const TAB_SUBTITLE = {
  colecao: 'Escolha um relógio da coleção e veja sugestões de look combinando.',
  montar: 'Diga as cores do seu look e veja qual relógio da coleção combina.',
}

function App() {
  const [tab, setTab] = useState('hoje') // 'hoje' | 'colecao' | 'montar' | 'guardaroupa'
  const [query, setQuery] = useState('')
  const [colorFilter, setColorFilter] = useState('todos')
  const [typeFilter, setTypeFilter] = useState('todos')
  const [brandFilter, setBrandFilter] = useState('todos')
  const [materialFilter, setMaterialFilter] = useState('todos')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [sortBy, setSortBy] = useState('nome')
  const [selectedId, setSelectedId] = useState(null)
  const [formTarget, setFormTarget] = useState(null) // null | 'new' | watchId
  const [showBackup, setShowBackup] = useState(false)
  const [lookOutfit, setLookOutfit] = useState(DEFAULT_OUTFIT)
  const [lookContext, setLookContext] = useState('casual')

  const { collection, favorites, addWatch, updateWatch, deleteWatch, resetCollection, toggleFavorite, refresh: refreshCollection } = useWatchCollection()
  const wardrobe = useWardrobe()
  const { sneakers, perfumes } = wardrobe
  const rec = useRecommendationHistory()
  const { history, logWornToday, logChoice, logFeedback } = rec
  const { weather, fetchWeather } = useWeather()
  const { bias } = usePreferences(rec.choices, rec.feedback)

  const handleSaveWatch = (data) => {
    if (formTarget === 'new') addWatch(data)
    else updateWatch(formTarget, data)
    setFormTarget(null)
  }

  const handleDeleteWatch = (id) => {
    if (!window.confirm('Remover esse relógio da coleção?')) return
    deleteWatch(id)
    setSelectedId(null)
    setFormTarget(null)
  }

  const handleImportFile = async (file) => {
    const text = await file.text()
    const data = JSON.parse(text)
    importData(data)
    refreshCollection()
    rec.refresh()
    wardrobe.refresh()
  }

  const selectedWatch = useMemo(() => collection.find((w) => w.id === selectedId) ?? null, [collection, selectedId])
  const editingWatch = useMemo(
    () => (formTarget && formTarget !== 'new' ? collection.find((w) => w.id === formTarget) ?? null : null),
    [collection, formTarget],
  )

  const brands = useMemo(() => [...new Set(collection.map((w) => w.marca).filter(Boolean))].sort(), [collection])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matches = collection.filter((w) => {
      if (q && !w.nome.toLowerCase().includes(q)) return false
      if (colorFilter !== 'todos' && getColorFilterGroup(w.cor) !== colorFilter) return false
      if (typeFilter !== 'todos' && !inferWatchTypes(w).includes(typeFilter)) return false
      if (brandFilter !== 'todos' && w.marca !== brandFilter) return false
      if (materialFilter !== 'todos' && inferBraceletMaterial(w) !== materialFilter) return false
      if (favoritesOnly && !favorites.includes(w.id)) return false
      return true
    })
    return sortCollection(matches, sortBy, { history, weatherBias: weather.status === 'ready' ? weather.bias : null, personalBias: bias })
  }, [collection, query, colorFilter, typeFilter, brandFilter, materialFilter, favoritesOnly, favorites, sortBy, history, weather, bias])

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
          onResetCollection={resetCollection}
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
          onToggleFavorite={() => toggleFavorite(selectedWatch.id)}
          lastWorn={lastWornDate(selectedWatch.id, history)}
          onLogWornToday={() => logWornToday(selectedWatch.id)}
          onEdit={() => setFormTarget(selectedWatch.id)}
          onDelete={() => handleDeleteWatch(selectedWatch.id)}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 pb-20 md:pb-0">
      <header className="sticky top-0 z-10 border-b border-white/5 bg-neutral-950/90 px-4 pb-4 pt-6 backdrop-blur">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Watch <span className="text-amber-400">&amp;</span> Look
              </h1>
              {TAB_SUBTITLE[tab] && <p className="mt-1 text-sm text-neutral-400">{TAB_SUBTITLE[tab]}</p>}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => setShowBackup(true)}
                aria-label="Dados e backup"
                className="rounded-full border border-white/10 bg-white/5 p-2 text-neutral-400 transition hover:bg-white/10 hover:text-neutral-100"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
          </div>

          {tab === 'colecao' && (
            <div className="mt-4">
              <FilterBar
                query={query}
                onQueryChange={setQuery}
                colorFilter={colorFilter}
                onColorChange={setColorFilter}
                typeFilter={typeFilter}
                onTypeChange={setTypeFilter}
                brandFilter={brandFilter}
                onBrandChange={setBrandFilter}
                brands={brands}
                materialFilter={materialFilter}
                onMaterialChange={setMaterialFilter}
                favoritesOnly={favoritesOnly}
                onFavoritesOnlyChange={setFavoritesOnly}
                sortBy={sortBy}
                onSortChange={setSortBy}
              />
            </div>
          )}
        </div>
      </header>

      <BottomNav active={tab} onChange={setTab} />

      <main className="mx-auto max-w-2xl px-4 py-5">
        {tab === 'hoje' && (
          <TodayScreen
            watches={collection}
            weather={weather}
            onFetchWeather={fetchWeather}
            history={history}
            bias={bias}
            sneakers={sneakers}
            perfumes={perfumes}
            onLogWornToday={logWornToday}
            onLogFeedback={logFeedback}
            onGoToMontar={() => setTab('montar')}
            onGoToColecao={() => setTab('colecao')}
          />
        )}

        {tab === 'montar' && (
          <LookMatcher
            watches={collection}
            onSelectWatch={setSelectedId}
            outfit={lookOutfit}
            onOutfitChange={setLookOutfit}
            context={lookContext}
            onContextChange={setLookContext}
            history={history}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            weather={weather}
            onFetchWeather={fetchWeather}
            bias={bias}
            onLogChoice={logChoice}
            onLogFeedback={logFeedback}
            sneakers={sneakers}
            perfumes={perfumes}
          />
        )}

        {tab === 'guardaroupa' && (
          <WardrobePanel
            sneakers={sneakers}
            perfumes={perfumes}
            onAddSneaker={wardrobe.addSneaker}
            onImportSneakers={wardrobe.addSneakers}
            onUpdateSneaker={wardrobe.updateSneaker}
            onDeleteSneaker={wardrobe.deleteSneaker}
            onAddPerfume={wardrobe.addPerfume}
            onUpdatePerfume={wardrobe.updatePerfume}
            onDeletePerfume={wardrobe.deletePerfume}
          />
        )}

        {tab === 'colecao' && (
          <>
            <ForgottenWatches watches={collection} history={history} onSelectWatch={setSelectedId} />
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
                    onToggleFavorite={() => toggleFavorite(w.id)}
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
