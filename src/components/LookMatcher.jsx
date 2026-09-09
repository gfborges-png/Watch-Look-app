import { useId, useMemo, useState } from 'react'
import { LOOK_COLORS, CONTEXTS, GARMENTS } from '../lib/matchEngine.js'
import { recommendWatchesForLook } from '../lib/recommendationEngine.js'
import { paletteGroup } from '../lib/outfitEngine.js'
import { detectDominantColorId, detectLookZones, closestLookColorId } from '../lib/colorDetect.js'
import { suggestPerfume } from '../lib/perfumeEngine.js'
import { Chip } from './FilterBar.jsx'
import WatchCard from './WatchCard.jsx'

const SUBSCORE_LABELS = { cor: 'Cor', ocasiao: 'Ocasião', estilo: 'Estilo', clima: 'Clima', rotacao: 'Rotação', preferencia: 'Preferência' }

const DISLIKE_REASONS = [
  { id: 'cor', label: 'Cor' },
  { id: 'formal-demais', label: 'Formal demais' },
  { id: 'casual-demais', label: 'Casual demais' },
  { id: 'relogio-errado', label: 'Relógio errado' },
  { id: 'tenis-errado', label: 'Tênis errado' },
  { id: 'perfume-errado', label: 'Perfume errado' },
  { id: 'outro', label: 'Outro' },
]

function MatchExplanation({ subScores, reasons }) {
  const entries = Object.entries(subScores).filter(([, v]) => v != null)
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs">
      {entries.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-neutral-400">
          {entries.map(([key, v]) => (
            <span key={key}>
              {SUBSCORE_LABELS[key]}: <span className="font-semibold text-neutral-200">{v}</span>
            </span>
          ))}
        </div>
      )}
      {reasons.length > 0 && (
        <ul className="mt-2 space-y-1 text-neutral-400">
          {reasons.map((r) => (
            <li key={r}>• {r[0].toUpperCase() + r.slice(1)}</li>
          ))}
        </ul>
      )}
      {entries.length === 0 && reasons.length === 0 && (
        <p className="text-neutral-500">Com mais dados (clima, ocasião, histórico de uso) esse match fica mais preciso.</p>
      )}
    </div>
  )
}

function FeedbackButtons({ result, context, onLogFeedback }) {
  const [state, setState] = useState('idle') // 'idle' | 'asking' | 'done'
  const [ratingDone, setRatingDone] = useState(null)

  const submit = (rating, reason = null) => {
    onLogFeedback({
      watchId: result.watch.id,
      group: paletteGroup(result.watch.cor),
      rating,
      reason,
      match: result.match,
      context,
    })
    setRatingDone(rating)
    setState('done')
  }

  if (state === 'done') {
    const label = ratingDone === 'love' ? '❤️ Ficou perfeito — anotado' : ratingDone === 'like' ? '👍 Anotado' : '👎 Anotado'
    return <span className="text-[11px] text-neutral-500">{label}</span>
  }

  if (state === 'asking') {
    return (
      <div className="flex flex-wrap items-center gap-1">
        {DISLIKE_REASONS.map((r) => (
          <button
            key={r.id}
            onClick={() => submit('dislike', r.id)}
            className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-neutral-400 transition hover:bg-white/10"
          >
            {r.label}
          </button>
        ))}
        <button onClick={() => submit('dislike', null)} className="text-[10px] text-neutral-600 hover:text-neutral-400">
          pular
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-0.5">
      <button onClick={() => submit('like')} aria-label="Boa sugestão" title="Boa sugestão" className="rounded-full p-1 text-sm transition hover:bg-white/10">
        👍
      </button>
      <button onClick={() => submit('love')} aria-label="Ficou perfeito" title="Ficou perfeito" className="rounded-full p-1 text-sm transition hover:bg-white/10">
        ❤️
      </button>
      <button onClick={() => setState('asking')} aria-label="Não usaria" title="Não usaria" className="rounded-full p-1 text-sm transition hover:bg-white/10">
        👎
      </button>
    </div>
  )
}

function MatchResultCard({ result, context, onSelectWatch, favorites, onToggleFavorite, onLogFeedback }) {
  const [expanded, setExpanded] = useState(false)
  const { watch, match, band, subScores, reasons } = result

  return (
    <div className="space-y-1.5">
      <WatchCard
        watch={watch}
        onClick={() => onSelectWatch(watch.id)}
        reason={reasons[0] ? reasons[0][0].toUpperCase() + reasons[0].slice(1) : undefined}
        percent={match}
        isFavorite={favorites.includes(watch.id)}
        onToggleFavorite={() => onToggleFavorite(watch.id)}
      />
      <div className="flex items-center justify-between gap-2 px-1">
        <button onClick={() => setExpanded((v) => !v)} className="text-[11px] font-medium text-neutral-500 transition hover:text-neutral-300">
          {expanded ? 'Ocultar motivos' : 'Por que escolhi este?'} · <span className="text-amber-400">{band.label}</span>
        </button>
        <FeedbackButtons result={result} context={context} onLogFeedback={onLogFeedback} />
      </div>
      {expanded && <MatchExplanation subScores={subScores} reasons={reasons} />}
    </div>
  )
}

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

function MeusTenisRow({ sneakers, onPick }) {
  if (!sneakers || sneakers.length === 0) return null
  return (
    <div>
      <p className="mb-1.5 text-[11px] uppercase tracking-wide text-neutral-500">Meus tênis</p>
      <div className="flex flex-wrap gap-1.5">
        {sneakers.map((s) => (
          <button
            key={s.id}
            onClick={() => onPick(s)}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-neutral-300 transition hover:bg-white/10"
          >
            <span
              className="h-3 w-3 shrink-0 rounded-full ring-1 ring-white/20"
              style={{
                background:
                  s.hexes.length > 1
                    ? `conic-gradient(${s.hexes[0]} 0% 50%, ${s.hexes[1]} 50% 100%)`
                    : s.hexes[0],
              }}
            />
            {s.nome}
          </button>
        ))}
      </div>
    </div>
  )
}

function GarmentSection({ garment, piece, onChange, sneakers }) {
  const setColor = (colorId) => onChange({ ...piece, colorId })
  const setTipo = (tipo) => onChange({ ...piece, tipo })
  const setModelo = (modelo) => onChange({ ...piece, modelo })
  const pickSneaker = (s) => onChange({ ...piece, colorId: closestLookColorId(s.hexes[0]), modelo: s.nome, tipo: s.tipo })

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
          {garment.key === 'calcado' && <MeusTenisRow sneakers={sneakers} onPick={pickSneaker} />}
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

function WholeLookPhotoButton({ onDetected }) {
  const [status, setStatus] = useState('idle') // 'idle' | 'loading' | 'error'
  const inputId = useId()

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setStatus('loading')
    try {
      const zones = await detectLookZones(file)
      onDetected(zones)
      setStatus('idle')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="rounded-2xl border border-dashed border-amber-400/30 bg-amber-400/5 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400/10">
          <svg className="h-4.5 w-4.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h1.5l1-1.5h9l1 1.5H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <circle cx="12" cy="13.5" r="3.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <label htmlFor={inputId} className="cursor-pointer text-sm font-semibold text-amber-400">
            {status === 'loading' ? 'Analisando a foto...' : 'Preencher tudo com uma foto do look'}
          </label>
          <p className="mt-0.5 text-[11px] text-neutral-500">
            Estimativa por zonas da foto (camisa/calça/tênis) — confere e ajusta se precisar. Funciona melhor com foto de
            corpo inteiro, de frente.
          </p>
          {status === 'error' && <p className="mt-1 text-xs text-red-400">Não deu pra ler essa foto</p>}
        </div>
      </div>
      <input id={inputId} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
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
      match: entry.match,
      context,
      wasSuggested,
    })
    setLogged(true)
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-4">
      <p className="text-xs text-neutral-500">
        Escolheu outro relógio, mesmo sem eu ter sugerido? Conta pra mim — uso isso pra calibrar as próximas sugestões.
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
              <div className="h-full rounded-full bg-amber-400" style={{ width: `${entry.match}%` }} />
            </div>
            <span className="text-xs font-semibold tabular-nums text-neutral-400">
              {entry.match} — {entry.band.label}
            </span>
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

function ClimaEOcasiaoPanel({ weather, onFetchWeather, context, onContextChange }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-100">Clima de hoje</p>
          {weather.status === 'ready' && (
            <p className="mt-0.5 text-xs text-neutral-400">
              {weather.tempC}°C, {weather.description} — {weather.bias === 'ameno' ? 'temperatura amena, então relógio e perfume seguem só pelo look e ocasião' : `puxando a sugestão pra mostradores e perfume mais ${weather.bias === 'quente' ? 'claros' : 'quentes'}`}
            </p>
          )}
          {weather.status === 'error' && <p className="mt-0.5 text-xs text-red-400">{weather.error}</p>}
          {weather.status === 'idle' && (
            <p className="mt-0.5 text-xs text-neutral-500">Ajusta o relógio e o perfume sugeridos pro clima real de hoje</p>
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

      <div className="mt-3 border-t border-white/5 pt-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Ocasião</p>
        <div className="flex gap-2">
          {CONTEXTS.map((ctx) => (
            <Chip key={ctx.id} active={context === ctx.id} onClick={() => onContextChange(ctx.id)}>
              {ctx.label}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  )
}

function PerfumePanel({ weatherBias, context, ownedPerfumes }) {
  const p = useMemo(() => suggestPerfume({ weatherBias, context, ownedPerfumes }), [weatherBias, context, ownedPerfumes])
  return (
    <div className="rounded-2xl border border-amber-400/20 bg-gradient-to-br from-neutral-900/70 to-neutral-900/30 p-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400/10">
          <svg className="h-4.5 w-4.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 2h6M10 2v3.3c0 .5-.2 1-.55 1.37L7.1 9.2A3 3 0 006 11.4V20a2 2 0 002 2h8a2 2 0 002-2v-8.6a3 3 0 00-1.1-2.2L14.55 6.7A2 2 0 0114 5.3V2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.2 13.5h9.6" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-neutral-100">Perfume sugerido</p>
          <p className="text-[11px] text-neutral-500">pro clima e ocasião de cima</p>
        </div>
      </div>

      <p className="mt-4 text-lg font-bold leading-tight text-amber-400">{p.familia}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {p.descritores.map((d) => (
          <span key={d} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-neutral-300">
            {d}
          </span>
        ))}
      </div>

      <p className="mt-3 text-xs leading-relaxed text-neutral-400">{p.porque}</p>

      {p.owned.length > 0 && (
        <div className="mt-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-400">Da sua coleção</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {p.owned.map((o) => (
              <span key={o.id} className="rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-semibold text-neutral-950">
                {o.nome}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Referências reais</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {p.referencias.map((r) => (
            <span
              key={r}
              className="rounded-full border border-amber-400/25 bg-amber-400/10 px-2.5 py-1 text-[11px] font-medium text-amber-300"
            >
              {r}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-black/30 p-3 text-xs text-neutral-400">
        <p>{p.intensidade}</p>
        {p.evitar && <p className="mt-1 text-neutral-500">{p.evitar}</p>}
      </div>
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
  history,
  favorites,
  onToggleFavorite,
  weather,
  onFetchWeather,
  bias,
  onLogChoice,
  onLogFeedback,
  sneakers,
  perfumes,
}) {
  const weatherBias = weather.status === 'ready' ? weather.bias : null
  const results = useMemo(
    () => recommendWatchesForLook(watches, outfit, context, { weatherBias, history, personalBias: bias }),
    [watches, outfit, context, history, weatherBias, bias],
  )

  const hasSelection = GARMENTS.some((g) => {
    const piece = outfit[g.key]
    return (!g.optional || piece.enabled) && piece.colorId
  })
  const topResults = hasSelection ? results.slice(0, 5) : []

  const handleWholeLookPhoto = (zones) => {
    onOutfitChange({
      ...outfit,
      camisa: zones.camisa ? { ...outfit.camisa, colorId: zones.camisa } : outfit.camisa,
      calca: zones.calca ? { ...outfit.calca, colorId: zones.calca } : outfit.calca,
      calcado: zones.calcado ? { ...outfit.calcado, colorId: zones.calcado } : outfit.calcado,
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">1. O que você está usando</p>
        <div className="space-y-3">
          <WholeLookPhotoButton onDetected={handleWholeLookPhoto} />
          {GARMENTS.map((garment) => (
            <GarmentSection
              key={garment.key}
              garment={garment}
              piece={outfit[garment.key]}
              onChange={(next) => onOutfitChange({ ...outfit, [garment.key]: next })}
              sneakers={sneakers}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">2. Contexto do dia</p>
        <div className="space-y-3">
          <ClimaEOcasiaoPanel weather={weather} onFetchWeather={onFetchWeather} context={context} onContextChange={onContextChange} />
          <PerfumePanel weatherBias={weatherBias} context={context} ownedPerfumes={perfumes} />
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">3. Relógios que combinam</p>
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
              {topResults.length} {topResults.length === 1 ? 'resultado' : 'resultados'}, do que mais pro que menos combina
            </p>
            {topResults.map((result) => (
              <MatchResultCard
                key={result.watch.id}
                result={result}
                context={context}
                onSelectWatch={onSelectWatch}
                favorites={favorites}
                onToggleFavorite={onToggleFavorite}
                onLogFeedback={onLogFeedback}
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">4. Sua escolha real</p>
        <ChoiceLogger watches={watches} results={results} topResults={topResults} context={context} onLogChoice={onLogChoice} />
      </div>
    </div>
  )
}
