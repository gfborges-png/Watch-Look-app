import { useMemo, useState } from 'react'
import { CONTEXTS } from '../lib/matchEngine.js'
import { buildTodayCandidates, defaultOccasionForToday, greetingForNow } from '../lib/dailyRecommendation.js'
import ColorSwatch from './ColorSwatch.jsx'

const BAND_COLOR = {
  excelente: 'text-emerald-400',
  'muito-bom': 'text-amber-400',
  bom: 'text-amber-400',
  funciona: 'text-neutral-300',
  evitaria: 'text-red-400',
}

const TIER_LABELS = ['Melhor escolha', 'Alternativa', 'Quero variar']

function LookLine({ label, value }) {
  if (!value) return null
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <span className="text-[11px] uppercase tracking-wide text-neutral-500">{label}</span>
      <span className="truncate text-right text-sm text-neutral-200">{value}</span>
    </div>
  )
}

export default function TodayScreen({
  watches,
  weather,
  onFetchWeather,
  history,
  bias,
  sneakers,
  perfumes,
  onLogWornToday,
  onLogFeedback,
  onGoToMontar,
  onGoToColecao,
}) {
  const [tierIndex, setTierIndex] = useState(0)
  const [usedToday, setUsedToday] = useState(false)

  const contextId = useMemo(() => defaultOccasionForToday(), [])
  const contextLabel = CONTEXTS.find((c) => c.id === contextId)?.label
  const weatherBias = weather.status === 'ready' ? weather.bias : null

  const candidates = useMemo(
    () => buildTodayCandidates(watches, { contextId, weatherBias, history, personalBias: bias, sneakers, perfumes, count: 3 }),
    [watches, contextId, weatherBias, history, bias, sneakers, perfumes],
  )

  if (watches.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 p-8 text-center text-sm text-neutral-500">
        Adicione relógios à sua coleção pra receber o Look do Dia.
      </div>
    )
  }

  const candidate = candidates[tierIndex % candidates.length]

  const handleUseLook = () => {
    onLogWornToday(candidate.watch.id)
    onLogFeedback({
      watchId: candidate.watch.id,
      group: candidate.group,
      rating: 'love',
      reason: null,
      match: candidate.match,
      context: contextId,
    })
    setUsedToday(true)
  }

  const handleAnotherSuggestion = () => {
    setUsedToday(false)
    setTierIndex((i) => (i + 1) % candidates.length)
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-neutral-50">{greetingForNow()}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-neutral-400">
          {weather.status === 'ready' && (
            <span>
              {weather.tempC}°C · {weather.description}
            </span>
          )}
          {weather.status === 'loading' && <span>Buscando clima...</span>}
          {(weather.status === 'idle' || weather.status === 'error') && (
            <button onClick={onFetchWeather} className="font-medium text-amber-400 hover:underline">
              Usar clima de hoje
            </button>
          )}
          <span className="text-neutral-700">·</span>
          <span>{contextLabel}</span>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-amber-400/25 bg-gradient-to-br from-amber-400/10 via-neutral-900 to-neutral-900 p-5 shadow-lg shadow-black/40">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-400">{TIER_LABELS[tierIndex % TIER_LABELS.length]} pra hoje</p>

        <div className="mt-3 flex items-center gap-4">
          <ColorSwatch hexes={candidate.watch.hexes} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-neutral-50">{candidate.watch.nome}</p>
            <p className="truncate text-xs text-neutral-400">{candidate.watch.marca}</p>
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className={`text-3xl font-black tabular-nums ${BAND_COLOR[candidate.band.id]}`}>{candidate.match}</span>
          <span className="text-sm font-semibold text-neutral-400">— {candidate.band.label}</span>
        </div>

        <div className="mt-4 divide-y divide-white/5 rounded-2xl bg-black/25 px-3.5 py-1">
          <LookLine label="Parte de cima" value={candidate.look.top} />
          <LookLine label="Calça" value={candidate.look.bottom} />
          <LookLine label="Tênis" value={candidate.sneaker ? candidate.sneaker.nome : candidate.look.tenis} />
          <LookLine label="Perfume" value={candidate.perfume.owned[0]?.nome ?? candidate.perfume.familia} />
        </div>

        <div className="mt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Motivos</p>
          <ul className="mt-1.5 space-y-1 text-xs text-neutral-400">
            {candidate.reasons.slice(0, 5).map((r) => (
              <li key={r}>• {r[0].toUpperCase() + r.slice(1)}</li>
            ))}
          </ul>
        </div>

        <div className="mt-4 space-y-2">
          <button
            onClick={handleUseLook}
            disabled={usedToday}
            className="w-full rounded-full bg-amber-400 px-4 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-amber-300 disabled:opacity-60"
          >
            {usedToday ? '✓ Marcado como usado hoje' : 'Vou usar esse look'}
          </button>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleAnotherSuggestion}
              className="rounded-full border border-white/10 bg-white/5 px-2 py-2 text-[11px] font-medium text-neutral-300 transition hover:bg-white/10"
            >
              Outra sugestão
            </button>
            <button
              onClick={onGoToMontar}
              className="rounded-full border border-white/10 bg-white/5 px-2 py-2 text-[11px] font-medium text-neutral-300 transition hover:bg-white/10"
            >
              Montar meu look
            </button>
            <button
              onClick={onGoToColecao}
              className="rounded-full border border-white/10 bg-white/5 px-2 py-2 text-[11px] font-medium text-neutral-300 transition hover:bg-white/10"
            >
              Escolher relógio
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
