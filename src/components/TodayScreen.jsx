import { useMemo, useState } from 'react'
import { CONTEXTS } from '../lib/matchEngine.js'
import { buildTodayCandidates, defaultOccasionForToday, greetingForNow, pickAdjustedIndex } from '../lib/dailyRecommendation.js'
import ColorSwatch from './ColorSwatch.jsx'

const BAND_COLOR = {
  excelente: 'text-emerald-400',
  'muito-bom': 'text-accent',
  bom: 'text-accent',
  funciona: 'text-text-muted',
  evitaria: 'text-red-400',
}

const ADJUST_ACTIONS = [
  { direction: 'outra', label: 'Outra opção' },
  { direction: 'casual', label: 'Mais casual' },
  { direction: 'sofisticado', label: 'Mais sofisticado' },
  { direction: 'variar', label: 'Quero variar' },
  { direction: 'ousado', label: 'Mais ousado' },
]

// Uma linha do look; se `onSwap` vier, ganha um "trocar" que abre um
// select com o catálogo — o mesmo mecanismo de "lock item" pra qualquer
// categoria (aqui: tênis, perfume), não só o relógio que já guia a
// recomendação do dia.
function LookLine({ label, value, locked, onSwap, swapOptions, onReset }) {
  const [pickerOpen, setPickerOpen] = useState(false)
  if (!value) return null

  return (
    <div className="py-1">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[11px] uppercase tracking-wide text-text-muted">{label}</span>
        <div className="flex items-center gap-1.5">
          <span className="truncate text-right text-sm text-text">
            {locked && <span title="Fixado por você — o resto do look se ajusta em volta">🔒 </span>}
            {value}
          </span>
          {onSwap && (
            <button onClick={() => setPickerOpen((v) => !v)} className="shrink-0 text-[10px] font-medium text-accent hover:underline">
              trocar
            </button>
          )}
        </div>
      </div>
      {pickerOpen && (
        <select
          value=""
          onChange={(e) => {
            if (e.target.value === '__auto__') onReset()
            else onSwap(e.target.value)
            setPickerOpen(false)
          }}
          className="mt-1.5 w-full rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-xs text-text focus:border-accent focus:outline-none"
        >
          <option value="" disabled>
            Escolher da sua coleção...
          </option>
          {locked && <option value="__auto__">← Voltar pra sugestão automática</option>}
          {swapOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.nome}
            </option>
          ))}
        </select>
      )}
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
  const [candidateIndex, setCandidateIndex] = useState(0)
  const [usedToday, setUsedToday] = useState(false)
  const [lockedSneakerId, setLockedSneakerId] = useState(null)
  const [lockedPerfumeId, setLockedPerfumeId] = useState(null)

  const contextId = useMemo(() => defaultOccasionForToday(), [])
  const contextLabel = CONTEXTS.find((c) => c.id === contextId)?.label
  const weatherBias = weather.status === 'ready' ? weather.bias : null

  const candidates = useMemo(
    () => buildTodayCandidates(watches, { contextId, weatherBias, history, personalBias: bias, sneakers, perfumes }),
    [watches, contextId, weatherBias, history, bias, sneakers, perfumes],
  )

  if (watches.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border p-8 text-center text-sm text-text-muted">
        Adicione relógios à sua coleção pra receber o Look do Dia.
      </div>
    )
  }

  const candidate = candidates[candidateIndex % candidates.length]

  // Tênis/perfume "travados" sobrepõem a sugestão do motor, mas nunca
  // impedem a tela de funcionar sem eles — resto do look continua vindo
  // normal (isFullCategoryOptional, §13: categoria vazia nunca bloqueia).
  const lockedSneaker = lockedSneakerId ? sneakers.find((s) => s.id === lockedSneakerId) : null
  const lockedPerfume = lockedPerfumeId ? perfumes.find((p) => p.id === lockedPerfumeId) : null
  const effectiveSneakerName = lockedSneaker?.nome ?? (candidate.sneaker ? candidate.sneaker.nome : candidate.look.tenis)
  const effectivePerfumeName = lockedPerfume?.nome ?? candidate.perfume.owned[0]?.nome ?? candidate.perfume.familia

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

  const handleAdjust = (direction) => {
    setUsedToday(false)
    setCandidateIndex((i) => pickAdjustedIndex(candidates, i % candidates.length, direction, { history }))
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-text">{greetingForNow()}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-text-muted">
          {weather.status === 'ready' && (
            <span>
              {weather.tempC}°C · {weather.description}
            </span>
          )}
          {weather.status === 'loading' && <span>Buscando clima...</span>}
          {(weather.status === 'idle' || weather.status === 'error') && (
            <button onClick={onFetchWeather} className="font-medium text-accent hover:underline">
              Usar clima de hoje
            </button>
          )}
          <span className="text-text-muted">·</span>
          <span>{contextLabel}</span>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-accent/30 bg-gradient-to-br from-accent/10 via-surface-2 to-surface-2 p-5 shadow-lg shadow-black/40">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">Melhor escolha pra hoje</p>

        <div className="mt-3 flex items-center gap-4">
          <ColorSwatch hexes={candidate.watch.hexes} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-text">{candidate.watch.nome}</p>
            <p className="truncate text-xs text-text-muted">{candidate.watch.marca}</p>
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className={`text-3xl font-black tabular-nums ${BAND_COLOR[candidate.band.id]}`}>{candidate.match}</span>
          <span className="text-sm font-semibold text-text-muted">— {candidate.band.label}</span>
        </div>

        <div className="mt-4 divide-y divide-border rounded-2xl bg-surface-2 px-3.5 py-1">
          <LookLine label="Parte de cima" value={candidate.look.top} />
          <LookLine label="Calça" value={candidate.look.bottom} />
          <LookLine
            label="Tênis"
            value={effectiveSneakerName}
            locked={!!lockedSneaker}
            swapOptions={sneakers}
            onSwap={setLockedSneakerId}
            onReset={() => setLockedSneakerId(null)}
          />
          <LookLine
            label="Perfume"
            value={effectivePerfumeName}
            locked={!!lockedPerfume}
            swapOptions={perfumes}
            onSwap={setLockedPerfumeId}
            onReset={() => setLockedPerfumeId(null)}
          />
        </div>

        <div className="mt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Motivos</p>
          <ul className="mt-1.5 space-y-1 text-xs text-text-muted">
            {candidate.reasons.slice(0, 5).map((r) => (
              <li key={r}>• {r[0].toUpperCase() + r.slice(1)}</li>
            ))}
          </ul>
        </div>

        <div className="mt-4 space-y-2">
          <button
            onClick={handleUseLook}
            disabled={usedToday}
            className="w-full rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-bone transition hover:opacity-90 disabled:opacity-60"
          >
            {usedToday ? '✓ Marcado como usado hoje' : 'Vou usar esse look'}
          </button>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {ADJUST_ACTIONS.map((a) => (
              <button
                key={a.direction}
                onClick={() => handleAdjust(a.direction)}
                className="rounded-full border border-border bg-surface-2 px-2 py-2 text-[11px] font-medium text-text-muted transition hover:bg-surface-3"
              >
                {a.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onGoToMontar}
              className="rounded-full border border-border bg-surface-2 px-2 py-2 text-[11px] font-medium text-text-muted transition hover:bg-surface-3"
            >
              Montar meu look
            </button>
            <button
              onClick={onGoToColecao}
              className="rounded-full border border-border bg-surface-2 px-2 py-2 text-[11px] font-medium text-text-muted transition hover:bg-surface-3"
            >
              Escolher relógio
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
