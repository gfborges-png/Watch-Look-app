import { useId, useMemo, useState } from 'react'
import { LOOK_COLORS, CONTEXTS, GARMENTS, matchWatchesToLook } from '../lib/matchEngine.js'
import { paletteGroup } from '../lib/outfitEngine.js'
import { detectDominantColorId } from '../lib/colorDetect.js'
import { suggestPerfume } from '../lib/perfumeEngine.js'
import { Chip } from './FilterBar.jsx'
import WatchCard from './WatchCard.jsx'

function ColorRow({ colorId, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {LOOK_COLORS.map((c) => {
        const active = colorId === c.id
        return (
          <button
            key={c.id}
            onClick={() => onChange(active ? null : c.id)}
            title={c.label}
            aria-label={c.label}
            aria-pressed={active}
            className={`h-7 w-7 shrink-0 rounded-full ring-2 transition ${
              active ? 'ring-amber-400 scale-110' : 'ring-transparent hover:ring-white/30'
            }`}
            style={{ background: c.hex }}
          />
        )
      })}
    </div>
  )
}

function TipoRow({ tipos, tipo, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tipos.map((t) => (
        <Chip key={t} active={tipo === t} onClick={() => onChange(tipo === t ? null : t)}>
          {t}
        </Chip>
      ))}
    </div>
  )
}

function PhotoDetectButton({ onDetected }) {
  const [status, setStatus] = useState('idle') // 'idle' | 'loading' | 'error'
  const inputId = useId()

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setStatus('loading')
    try {
      const colorId = await detectDominantColorId(file)
      onDetected(colorId)
      setStatus('idle')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor={inputId}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-neutral-300 transition hover:bg-white/10"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h1.5l1-1.5h9l1 1.5H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <circle cx="12" cy="13.5" r="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {status === 'loading' ? 'Detectando...' : 'Detectar cor por foto'}
      </label>
      <input id={inputId} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
      {status === 'error' && <span className="text-xs text-red-400">Não deu pra ler essa foto</span>}
    </div>
  )
}

function GarmentSection({ garment, piece, onChange }) {
  const setColor = (colorId) => onChange({ ...piece, colorId })
  const setTipo = (tipo) => onChange({ ...piece, tipo })
  const setModelo = (modelo) => onChange({ ...piece, modelo })

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-neutral-100">{garment.label}</p>
        {garment.optional && (
          <div className="flex gap-1.5">
            <Chip active={piece.enabled} onClick={() => onChange({ ...piece, enabled: true })}>
              Com jaqueta
            </Chip>
            <Chip active={!piece.enabled} onClick={() => onChange({ enabled: false, colorId: null, tipo: null })}>
              Sem jaqueta
            </Chip>
          </div>
        )}
      </div>

      {(!garment.optional || piece.enabled) && (
        <div className="space-y-2.5">
          {garment.hasModel && (
            <input
              type="text"
              value={piece.modelo ?? ''}
              onChange={(e) => setModelo(e.target.value)}
              placeholder={garment.modelPlaceholder}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-amber-400/60 focus:outline-none"
            />
          )}
          <ColorRow colorId={piece.colorId} onChange={setColor} />
          <TipoRow tipos={garment.tipos} tipo={piece.tipo} onChange={setTipo} />
          <PhotoDetectButton onDetected={setColor} />
        </div>
      )}
    </div>
  )
}

function WeatherPanel({ weather, onFetchWeather }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-100">Clima de hoje</p>
          {weather.status === 'ready' && (
            <p className="mt-0.5 text-xs text-neutral-400">
              {weather.tempC}°C, {weather.description} — {weather.bias === 'ameno' ? 'sem viés no match' : `puxando pra mostradores mais ${weather.bias === 'quente' ? 'claros' : 'quentes'}`}
            </p>
          )}
          {weather.status === 'error' && <p className="mt-0.5 text-xs text-red-400">{weather.error}</p>}
          {weather.status === 'idle' && (
            <p className="mt-0.5 text-xs text-neutral-500">Usa sua localização pra puxar o match pro clima do dia</p>
          )}
        </div>
        <button
          onClick={onFetchWeather}
          disabled={weather.status === 'loading'}
          className="shrink-0 rounded-full bg-amber-400 px-3 py-1.5 text-xs font-semibold text-neutral-950 transition hover:bg-amber-300 disabled:opacity-60"
        >
          {weather.status === 'loading' ? 'Buscando...' : weather.status === 'ready' ? 'Atualizar' : 'Usar clima de hoje'}
        </button>
      </div>
    </div>
  )
}

function ChoiceLogger({ watches, results, topResults, context, onLogChoice }) {
  const [selectedId, setSelectedId] = useState('')
  const [logged, setLogged] = useState(false)
  const selectId = useId()

  const sorted = useMemo(() => [...watches].sort((a, b) => a.nome.localeCompare(b.nome)), [watches])
  const entry = selectedId ? results.find((r) => r.watch.id === selectedId) : null
  const wasSuggested = selectedId ? topResults.some((r) => r.watch.id === selectedId) : false

  const handleChange = (e) => {
    setSelectedId(e.target.value)
    setLogged(false)
  }

  const handleLog = () => {
    if (!entry) return
    onLogChoice({
      watchId: entry.watch.id,
      group: paletteGroup(entry.watch.cor),
      score: entry.score,
      percent: entry.percent,
      context,
      wasSuggested,
    })
    setLogged(true)
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-4">
      <p className="text-sm font-semibold text-neutral-100">Qual você escolheu de verdade?</p>
      <p className="mt-1 text-xs text-neutral-500">
        Mesmo que não tenha sido sugerido — conta pra mim, e eu uso isso pra calibrar as próximas sugestões.
      </p>
      <select
        id={selectId}
        value={selectedId}
        onChange={handleChange}
        className="mt-3 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-neutral-100 focus:border-amber-400/60 focus:outline-none"
      >
        <option value="">Selecione um relógio da coleção...</option>
        {sorted.map((w) => (
          <option key={w.id} value={w.id}>
            {w.nome}
          </option>
        ))}
      </select>

      {entry && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-amber-400" style={{ width: `${entry.percent}%` }} />
            </div>
            <span className="text-xs font-semibold tabular-nums text-neutral-400">{entry.percent}% de match</span>
          </div>
          <p className="text-xs text-neutral-500">
            {wasSuggested ? 'Estava entre os sugeridos.' : 'Fora do top sugerido — anotado, isso pesa mais no aprendizado.'}
            {entry.reasons[0] && ` ${entry.reasons[0][0].toUpperCase()}${entry.reasons[0].slice(1)}.`}
          </p>
          <button
            onClick={handleLog}
            className="w-full rounded-full bg-amber-400 px-3 py-2 text-xs font-semibold text-neutral-950 transition hover:bg-amber-300"
          >
            {logged ? '✓ Registrado' : 'Registrar essa escolha'}
          </button>
        </div>
      )}
    </div>
  )
}

function PerfumePanel({ weatherBias, context }) {
  const p = useMemo(() => suggestPerfume({ weatherBias, context }), [weatherBias, context])
  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-4">
      <p className="text-sm font-semibold text-neutral-100">Perfume sugerido</p>
      <p className="mt-1 text-xs text-neutral-400">
        <span className="font-medium text-amber-400">{p.familia}</span> — {p.descritores.join(', ')}
      </p>
      <p className="mt-2 text-xs text-neutral-500">{p.porque}</p>
      <p className="mt-1 text-xs text-neutral-500">
        {p.intensidade}
        {p.evitar ? ` · ${p.evitar}` : ''}
      </p>
    </div>
  )
}

export default function LookMatcher({
  watches,
  onSelectWatch,
  outfit,
  onOutfitChange,
  context,
  onContextChange,
  recentIds,
  favorites,
  onToggleFavorite,
  weather,
  onFetchWeather,
  bias,
  onLogChoice,
}) {
  const weatherBias = weather.status === 'ready' ? weather.bias : null
  const results = useMemo(
    () => matchWatchesToLook(watches, outfit, context, { recentIds, weatherBias, personalBias: bias }),
    [watches, outfit, context, recentIds, weatherBias, bias],
  )

  const hasSelection = GARMENTS.some((g) => {
    const piece = outfit[g.key]
    return (!g.optional || piece.enabled) && piece.colorId
  })
  const topResults = hasSelection ? results.filter((r) => r.score > 0).slice(0, 5) : []

  return (
    <div className="space-y-5">
      <WeatherPanel weather={weather} onFetchWeather={onFetchWeather} />

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">O que você está usando</p>
        <div className="space-y-3">
          {GARMENTS.map((garment) => (
            <GarmentSection
              key={garment.key}
              garment={garment}
              piece={outfit[garment.key]}
              onChange={(next) => onOutfitChange({ ...outfit, [garment.key]: next })}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Ocasião</p>
        <div className="flex gap-2">
          {CONTEXTS.map((ctx) => (
            <Chip key={ctx.id} active={context === ctx.id} onClick={() => onContextChange(ctx.id)}>
              {ctx.label}
            </Chip>
          ))}
        </div>
      </div>

      <PerfumePanel weatherBias={weatherBias} context={context} />

      <div>
        {!hasSelection ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-neutral-500">
            Escolha a cor de pelo menos uma peça pra ver quais relógios combinam.
          </div>
        ) : topResults.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-neutral-500">
            Nenhum match forte com esse look. Tenta um mostrador neutro (preto, branco ou prata) — combina com qualquer combinação.
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-neutral-500">
              {topResults.length} {topResults.length === 1 ? 'relógio combina' : 'relógios combinam'} com esse look
            </p>
            {topResults.map(({ watch, reasons, percent }) => (
              <WatchCard
                key={watch.id}
                watch={watch}
                onClick={() => onSelectWatch(watch.id)}
                reason={reasons[0] ? reasons[0][0].toUpperCase() + reasons[0].slice(1) : undefined}
                percent={percent}
                isFavorite={favorites.includes(watch.id)}
                onToggleFavorite={() => onToggleFavorite(watch.id)}
              />
            ))}
          </div>
        )}
      </div>

      <ChoiceLogger watches={watches} results={results} topResults={topResults} context={context} onLogChoice={onLogChoice} />
    </div>
  )
}
