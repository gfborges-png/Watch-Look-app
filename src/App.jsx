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
import { useLocalProfile } from './hooks/useLocalProfile.js'
import { useUserStyleProfile } from './hooks/useUserStyleProfile.js'
import WatchDetail from './components/WatchDetail.jsx'
import LookMatcher from './components/LookMatcher.jsx'
import WatchForm from './components/WatchForm.jsx'
import BackupPanel from './components/BackupPanel.jsx'
import WardrobePanel from './components/WardrobePanel.jsx'
import TodayScreen from './components/TodayScreen.jsx'
import MeusMoodesScreen from './components/MeusMoodesScreen.jsx'
import BottomNav from './components/BottomNav.jsx'
import MoodeLogo from './components/brand/MoodeLogo.jsx'

const TAB_SUBTITLE = {
  montar: 'Diga as cores do seu look e veja qual relógio da coleção combina.',
}

function App() {
  const [tab, setTab] = useState('hoje') // 'hoje' | 'guardaroupa' | 'montar' | 'historico'
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
  useLocalProfile()
  const { insights: styleInsights } = useUserStyleProfile({
    collection,
    choices: rec.choices,
    feedback: rec.feedback,
    favorites,
  })

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
      <div className="min-h-screen bg-surface text-text">
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
      <div className="min-h-screen bg-surface text-text">
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
      <div className="min-h-screen bg-surface text-text">
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
    <div className="min-h-screen bg-surface text-text pb-20 md:pb-0">
      <header className="sticky top-0 z-10 border-b border-border bg-surface/90 px-4 pb-4 pt-6 backdrop-blur">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <MoodeLogo className="text-xl" />
              {TAB_SUBTITLE[tab] && <p className="mt-1.5 text-sm text-text-muted">{TAB_SUBTITLE[tab]}</p>}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => setShowBackup(true)}
                aria-label="Dados e backup"
                className="rounded-full border border-border bg-surface-2 p-2 text-text-muted transition hover:bg-surface-3 hover:text-text"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
          </div>

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
            onGoToGuardaroupa={() => setTab('guardaroupa')}
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
            styleInsights={styleInsights}
            onAddSneaker={wardrobe.addSneaker}
            onImportSneakers={wardrobe.addSneakers}
            onUpdateSneaker={wardrobe.updateSneaker}
            onDeleteSneaker={wardrobe.deleteSneaker}
            onAddPerfume={wardrobe.addPerfume}
            onUpdatePerfume={wardrobe.updatePerfume}
            onDeletePerfume={wardrobe.deletePerfume}
            watches={{
              collection,
              filtered,
              total: collection.length,
              favorites,
              history,
              brands,
              query,
              onQueryChange: setQuery,
              colorFilter,
              onColorChange: setColorFilter,
              typeFilter,
              onTypeChange: setTypeFilter,
              brandFilter,
              onBrandChange: setBrandFilter,
              materialFilter,
              onMaterialChange: setMaterialFilter,
              favoritesOnly,
              onFavoritesOnlyChange: setFavoritesOnly,
              sortBy,
              onSortChange: setSortBy,
              onSelectWatch: setSelectedId,
              onToggleFavorite: toggleFavorite,
              onAddWatch: () => setFormTarget('new'),
            }}
          />
        )}

        {tab === 'historico' && (
          <MeusMoodesScreen
            history={history}
            feedback={rec.feedback}
            collection={collection}
            onUseAgain={(entry) => {
              logWornToday(entry.watch.id)
              logFeedback({
                watchId: entry.watch.id,
                group: getColorFilterGroup(entry.watch.cor),
                rating: 'love',
                reason: null,
                match: entry.score,
                context: entry.context,
              })
              setTab('hoje')
            }}
            onCreateVariation={(entry) => {
              if (entry.context) setLookContext(entry.context)
              setTab('montar')
            }}
          />
        )}
      </main>
    </div>
  )
}

export default App
