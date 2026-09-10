import { useMemo, useState } from 'react'
import { CONTEXTS } from '../lib/matchEngine.js'
import { VIBES } from '../lib/occasionDimensions.js'
import { buildTodayCandidates, defaultOccasionForToday, greetingForNow, pickAdjustedIndex } from '../lib/dailyRecommendation.js'
import { matchColorNameToHexes } from '../lib/colorNameMatch.js'
import { SNEAKER_REFERENCES } from '../lib/outfitEngine.js'
import { accessoryJustification } from '../lib/accessoryMatch.js'
import { accessoryDisplayName } from '../lib/accessoryModel.js'
import { weatherSummaryParts } from '../lib/weather.js'
import { Chip } from './FilterBar.jsx'
import BottomSheet from './ds/BottomSheet.jsx'
import SwitchMoode from './ds/SwitchMoode.jsx'

const BAND_COLOR = {
  excelente: 'text-emerald-600 dark:text-emerald-400',
  'muito-bom': 'text-accent',
  bom: 'text-accent',
  funciona: 'text-text-muted',
  evitaria: 'text-red-600 dark:text-red-400',
}

function PerfumeGlyph({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 2h6M10 2v3.3c0 .5-.2 1-.55 1.37L7.1 9.2A3 3 0 006 11.4V20a2 2 0 002 2h8a2 2 0 002-2v-8.6a3 3 0 00-1.1-2.2L14.55 6.7A2 2 0 0114 5.3V2" />
    </svg>
  )
}

// Sem cor conhecida pra essa peça (ex: perfume não tem cor; um look
// textual sem nenhuma palavra de cor reconhecida) — um ponto neutro em
// vez de inventar uma imagem ou usar um ícone que sugira outra coisa.
function NeutralGlyph({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <circle cx="12" cy="12" r="7" />
    </svg>
  )
}

// Uma peça do flat-lay editorial — swatch (ou glifo neutro, quando não
// há cor conhecida) + rótulo curto. Quando `onSwap` vem, a peça pode
// ser travada num item específico da coleção — o mesmo "lock item" em
// qualquer categoria, não só o relógio que guia a recomendação do dia.
function MoodeTile({ label, value, hexes, glyph, locked, onSwap, swapOptions, onReset, references }) {
  const [pickerOpen, setPickerOpen] = useState(false)
  if (!value) return null

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-surface-2 p-3">
      <div className="flex items-center gap-2.5">
        {hexes && hexes.length > 0 ? (
          <span
            className="h-9 w-9 shrink-0 rounded-full ring-1 ring-border"
            style={{ background: hexes.length > 1 ? `conic-gradient(${hexes[0]} 0% 50%, ${hexes[1]} 50% 100%)` : hexes[0] }}
          />
        ) : (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-3 text-text-muted">
            {glyph ?? <NeutralGlyph />}
          </span>
        )}
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wide text-text-muted">{label}</p>
          <p className="line-clamp-2 text-xs font-medium leading-snug text-text">
            {locked && <span title="Fixado por você">🔒 </span>}
            {value}
          </p>
        </div>
      </div>
      {references && references.length > 0 && (
        <p className="truncate text-[10px] text-text-muted/70">Outras opções: {references.slice(0, 2).join(' · ')}</p>
      )}
      {onSwap && (
        <button onClick={() => setPickerOpen((v) => !v)} className="-my-1 self-start px-1 py-1.5 text-[10px] font-medium text-accent hover:underline">
          trocar
        </button>
      )}
      {pickerOpen && (
        <select
          value=""
          onChange={(e) => {
            if (e.target.value === '__auto__') onReset()
            else onSwap(e.target.value)
            setPickerOpen(false)
          }}
          className="w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-text focus:border-accent focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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

// O perfume fecha a composição, mas não deveria competir visualmente com
// roupa/calçado/relógio — por isso vira uma linha discreta ("toque
// final"), não mais um card do mesmo peso dos outros na grade.
function PerfumeTouch({ value, locked, onSwap, swapOptions, onReset, references }) {
  const [pickerOpen, setPickerOpen] = useState(false)
  if (!value) return null

  return (
    <div className="rounded-lg bg-surface-2/50 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <PerfumeGlyph className="h-4 w-4 shrink-0 text-text-muted" />
          <p className="min-w-0 truncate text-xs text-text-muted">
            Toque final ·{' '}
            <span className="font-medium text-text">
              {locked && <span title="Fixado por você">🔒 </span>}
              {value}
            </span>
          </p>
        </div>
        {onSwap && (
          <button onClick={() => setPickerOpen((v) => !v)} className="-my-1 shrink-0 px-1 py-1.5 text-[10px] font-medium text-accent hover:underline">
            trocar
          </button>
        )}
      </div>
      {references && references.length > 0 && (
        <p className="mt-0.5 truncate pl-6 text-[10px] text-text-muted/70">Outras opções: {references.slice(0, 2).join(' · ')}</p>
      )}
      {pickerOpen && (
        <select
          value=""
          onChange={(e) => {
            if (e.target.value === '__auto__') onReset()
            else onSwap(e.target.value)
            setPickerOpen(false)
          }}
          className="mt-2 w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-text focus:border-accent focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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
  accessories,
  onLogWornToday,
  onLogFeedback,
  onGoToMontar,
  onGoToGuardaroupa,
}) {
  const [candidateIndex, setCandidateIndex] = useState(0)
  const [usedToday, setUsedToday] = useState(false)
  const [lockedSneakerId, setLockedSneakerId] = useState(null)
  const [lockedPerfumeId, setLockedPerfumeId] = useState(null)
  const [contextOverride, setContextOverride] = useState(null)
  const [contextSheetOpen, setContextSheetOpen] = useState(false)
  const [vibeId, setVibeId] = useState(null)
  const [vibeSheetOpen, setVibeSheetOpen] = useState(false)

  const contextId = contextOverride ?? defaultOccasionForToday()
  const contextLabel = CONTEXTS.find((c) => c.id === contextId)?.label
  const vibeLabel = VIBES.find((v) => v.id === vibeId)?.label
  const weatherBias = weather.status === 'ready' ? weather.bias : null

  const candidates = useMemo(
    () => buildTodayCandidates(watches, { contextId, weatherBias, history, personalBias: bias, sneakers, perfumes, accessories, vibeId }),
    [watches, contextId, weatherBias, history, bias, sneakers, perfumes, accessories, vibeId],
  )

  if (watches.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-text-muted">
        Adicione relógios à sua coleção pra receber o seu MOODE de hoje.
      </div>
    )
  }

  const candidate = candidates[candidateIndex % candidates.length]

  // Tênis/perfume "travados" sobrepõem a sugestão do motor, mas nunca
  // impedem a tela de funcionar sem eles — categoria vazia não bloqueia.
  const lockedSneaker = lockedSneakerId ? sneakers.find((s) => s.id === lockedSneakerId) : null
  const lockedPerfume = lockedPerfumeId ? perfumes.find((p) => p.id === lockedPerfumeId) : null
  const effectiveSneakerName = lockedSneaker?.nome ?? (candidate.sneaker ? candidate.sneaker.nome : candidate.look.tenis)
  const effectiveSneakerHexes = lockedSneaker?.hexes ?? candidate.sneaker?.hexes ?? null
  const effectivePerfumeName = lockedPerfume?.nome ?? candidate.perfume.owned[0]?.nome ?? candidate.perfume.familia
  // As frases de "look" (candidate.look.top/bottom) são texto puro, sem
  // objeto de cor — extrai a cor real mencionada no texto em vez de
  // inventar uma imagem ou usar um ícone genérico enganoso. Lookup
  // simples num pequeno dicionário — barato o bastante pra não precisar
  // de memoização.
  const topHexes = matchColorNameToHexes(candidate.look.top, 2)
  const bottomHexes = matchColorNameToHexes(candidate.look.bottom, 2)

  const handleUseLook = () => {
    const sneakerId = lockedSneaker?.id ?? candidate.sneaker?.id ?? null
    const perfumeId = lockedPerfume?.id ?? candidate.perfume.owned[0]?.id ?? null
    onLogWornToday(candidate.watch.id, { sneakerId, perfumeId })
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
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">{greetingForNow()}</p>
        <h1 className="mt-1 font-serif text-[2rem] leading-[1.08] text-text">Qual é o seu mood hoje?</h1>
        <p className="mt-1.5 max-w-xs text-sm text-text-muted">
          Conte o contexto e o MOODE monta uma combinação usando seu estilo, clima e acervo.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        {weather.status === 'ready' && <span className="text-text-muted">{weatherSummaryParts(weather).join(', ')}</span>}
        {weather.status === 'loading' && <span className="text-text-muted">Buscando clima...</span>}
        {weather.status === 'error' && <span className="text-text-muted">Não conseguimos atualizar o clima agora — seu MOODE segue sem ele.</span>}
        {(weather.status === 'idle' || weather.status === 'error') && (
          <button onClick={onFetchWeather} className="-my-1.5 py-1.5 font-medium text-accent hover:underline">
            Usar clima de hoje
          </button>
        )}
        <span className="text-text-muted">·</span>
        <button onClick={() => setContextSheetOpen(true)} className="-my-1.5 inline-flex items-center gap-1 py-1.5 font-medium text-text hover:text-accent">
          {contextLabel}
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
          </svg>
        </button>
        <span className="text-text-muted">·</span>
        <button onClick={() => setVibeSheetOpen(true)} className="-my-1.5 inline-flex items-center gap-1 py-1.5 font-medium text-text hover:text-accent">
          {vibeLabel ?? 'Qual vibe?'}
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </div>

      {weather.status === 'ready' && weather.precipitationMm > 0 && (
        <p className="text-xs text-text-muted">☔ Hoje tem chuva — leve algo à prova d'água.</p>
      )}

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <MoodeTile label="Parte de cima" value={candidate.look.top} hexes={topHexes} />
        <MoodeTile label="Calça" value={candidate.look.bottom} hexes={bottomHexes} />
        <MoodeTile
          label="Tênis"
          value={effectiveSneakerName}
          hexes={effectiveSneakerHexes}
          locked={!!lockedSneaker}
          swapOptions={sneakers}
          onSwap={setLockedSneakerId}
          onReset={() => setLockedSneakerId(null)}
          references={SNEAKER_REFERENCES[candidate.group]}
        />
        <MoodeTile label="Relógio" value={candidate.watch.nome} hexes={candidate.watch.hexes} />
        {candidate.accessoryPicks.map((pick, i) => (
          <MoodeTile
            key={pick.accessory.id}
            label={candidate.accessoryPicks.length > 1 ? `Acessório ${i + 1}` : 'Acessório'}
            value={accessoryDisplayName(pick.accessory)}
            hexes={[pick.accessory.primaryColor]}
          />
        ))}
      </div>

      <PerfumeTouch
        value={effectivePerfumeName}
        locked={!!lockedPerfume}
        swapOptions={perfumes}
        onSwap={setLockedPerfumeId}
        onReset={() => setLockedPerfumeId(null)}
        references={candidate.perfume.referencias}
      />

      <div className="border-t border-border pt-4">
        <div className="flex items-baseline gap-2">
          <span className={`font-serif text-3xl ${BAND_COLOR[candidate.band.id]}`}>{candidate.match}</span>
          <span className="text-sm font-semibold text-text">{candidate.band.label} para hoje</span>
        </div>
        {candidate.reasons.length > 0 && (
          <p className="mt-2 font-serif text-[15px] italic leading-snug text-text-muted">
            "{candidate.reasons[0][0].toUpperCase() + candidate.reasons[0].slice(1)}."
          </p>
        )}
        {candidate.accessoryPicks[0] && (
          <p className="mt-1 text-xs text-text-muted">{accessoryJustification(candidate.accessoryPicks[0])}</p>
        )}
      </div>

      <button
        onClick={handleUseLook}
        disabled={usedToday}
        className="w-full rounded-full bg-accent px-4 py-3 text-sm font-semibold text-bone transition hover:opacity-90 disabled:opacity-60"
      >
        {usedToday ? '✓ Marcado como usado hoje' : 'Vou usar'}
      </button>

      <SwitchMoode onSelect={handleAdjust} />

      <div className="-my-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-4 text-xs font-medium text-text-muted">
        <button onClick={onGoToMontar} className="py-1.5 hover:text-text">
          Já escolhi uma peça
        </button>
        <button onClick={() => handleAdjust('outra')} className="py-1.5 hover:text-text">
          Surpreenda-me
        </button>
        <button onClick={onGoToGuardaroupa} className="py-1.5 hover:text-text">
          Meu Acervo
        </button>
      </div>

      <BottomSheet open={contextSheetOpen} onClose={() => setContextSheetOpen(false)} title="Qual é o MOODE?">
        <div className="flex flex-wrap gap-2">
          {CONTEXTS.map((ctx) => (
            <Chip
              key={ctx.id}
              active={contextId === ctx.id}
              onClick={() => {
                setContextOverride(ctx.id)
                setContextSheetOpen(false)
              }}
            >
              {ctx.label}
            </Chip>
          ))}
        </div>
      </BottomSheet>

      <BottomSheet open={vibeSheetOpen} onClose={() => setVibeSheetOpen(false)} title="Como você quer se sentir?">
        <div className="flex flex-wrap gap-2">
          {VIBES.map((v) => (
            <Chip
              key={v.id}
              active={vibeId === v.id}
              onClick={() => {
                setVibeId(vibeId === v.id ? null : v.id)
                setVibeSheetOpen(false)
              }}
            >
              {v.label}
            </Chip>
          ))}
        </div>
      </BottomSheet>
    </div>
  )
}
