import { useMemo, useState } from 'react'
import { GROUP_LABEL, coloredActiveGarments } from '../../lib/matchEngine.js'
import { paletteGroup } from '../../lib/outfitEngine.js'
import { pickBestSneakerForGarments } from '../../lib/sneakerMatch.js'
import { suggestPerfume } from '../../lib/perfumeEngine.js'
import { SNEAKER_REFERENCES } from '../../lib/outfitEngine.js'
import { pickAccessoriesForLook, accessoryJustification } from '../../lib/accessoryMatch.js'
import { accessoryDisplayName } from '../../lib/accessoryModel.js'
import WatchCard from '../WatchCard.jsx'

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
    <div className="rounded-xl border border-border bg-surface-2 p-3 text-xs">
      {entries.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-text-muted">
          {entries.map(([key, v]) => (
            <span key={key}>
              {SUBSCORE_LABELS[key]}: <span className="font-semibold text-text">{v}</span>
            </span>
          ))}
        </div>
      )}
      {reasons.length > 0 && (
        <ul className="mt-2 space-y-1 text-text-muted">
          {reasons.map((r) => (
            <li key={r}>• {r[0].toUpperCase() + r.slice(1)}</li>
          ))}
        </ul>
      )}
      {entries.length === 0 && reasons.length === 0 && (
        <p className="text-text-muted">Com mais dados (clima, ocasião, histórico de uso) esse match fica mais preciso.</p>
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
    return <span className="text-[11px] text-text-muted">{label}</span>
  }

  if (state === 'asking') {
    return (
      <div className="flex flex-wrap items-center gap-1">
        {DISLIKE_REASONS.map((r) => (
          <button
            key={r.id}
            onClick={() => submit('dislike', r.id)}
            className="rounded-full border border-border px-2 py-1.5 text-[10px] text-text-muted transition hover:bg-surface-3"
          >
            {r.label}
          </button>
        ))}
        <button onClick={() => submit('dislike', null)} className="px-1.5 py-1.5 text-[10px] text-text-muted hover:text-text">
          pular
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-medium uppercase tracking-wide text-text-muted">Foi um bom MOODE?</span>
      <button onClick={() => submit('like')} aria-label="Gostei" title="Gostei" className="rounded-full p-2 text-sm transition hover:bg-surface-3">
        👍
      </button>
      <button onClick={() => submit('love')} aria-label="Adorei" title="Adorei" className="rounded-full p-2 text-sm transition hover:bg-surface-3">
        ❤️
      </button>
      <button onClick={() => setState('asking')} aria-label="Não usaria" title="Não usaria" className="rounded-full p-2 text-sm transition hover:bg-surface-3">
        👎
      </button>
    </div>
  )
}

// O conjunto relógio + tênis + perfume, com uma frase de justificativa —
// o perfume deixa de ser um recurso à parte e vira parte do resultado em
// si. Deixa também escolher manualmente outro perfume da coleção, se a
// sugestão automática não for a que a pessoa quer usar hoje.
function ResultBundle({ watch, weatherBias, context, sneakers, perfumes, accessories, outfit, vibeId }) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [overrideId, setOverrideId] = useState(null)

  const group = paletteGroup(watch.cor)
  // Peças com cor já resolvida no outfit (sem o próprio calçado, senão
  // ele "se recomendaria") — usadas tanto pra harmonia de cor quanto
  // (via sneakerMatch) pra ocasião/estilo. Bug real que isso corrige:
  // antes o tênis vinha só da cor (pickOwnedSneakerForGroup, sem noção
  // de ocasião), então um tênis bem casual podia ganhar de um sapato
  // social só por bater mais na cor, mesmo pra "Reunião importante".
  const otherGarments = useMemo(() => (outfit ? coloredActiveGarments(outfit).filter((g) => g.key !== 'calcado') : []), [outfit])
  const sneaker = useMemo(
    () => pickBestSneakerForGarments(sneakers, otherGarments, context, { weatherBias, vibeId }),
    [sneakers, otherGarments, context, weatherBias, vibeId],
  )
  const suggestion = useMemo(() => suggestPerfume({ weatherBias, context, ownedPerfumes: perfumes }), [weatherBias, context, perfumes])
  const overridden = overrideId ? perfumes.find((p) => p.id === overrideId) : null
  const perfumeLabel = overridden?.nome ?? suggestion.owned[0]?.nome ?? suggestion.familia

  // Cor de referência pro match de acessório: o relógio + as peças do
  // look que já têm cor resolvida (não só o relógio) — quanto mais
  // pistas de cor, mais preciso o sub-score de continuidade/contraste.
  const referenceHexes = useMemo(() => [...watch.hexes, ...otherGarments.map((g) => g.color.hex)], [watch.hexes, otherGarments])

  const accessoryPicks = useMemo(
    () => pickAccessoriesForLook(accessories ?? [], { referenceHexes, contextId: context, watch, sneaker, vibeId }),
    [accessories, referenceHexes, context, watch, sneaker, vibeId],
  )

  // "Por que funciona" fica curto de propósito — um único ponto, o mais
  // relevante pro conjunto como um todo (o motivo específico do relógio
  // já aparece separado, no WatchCard acima).
  const justification =
    weatherBias && weatherBias !== 'ameno'
      ? `Reforça um look ${GROUP_LABEL[group]}, que também combina com o clima ${weatherBias === 'quente' ? 'quente' : 'frio'} de hoje.`
      : `Reforça um look ${GROUP_LABEL[group]}.`

  const sneakerReferences = SNEAKER_REFERENCES[group] ?? []

  return (
    <div className="rounded-xl border border-border bg-surface-2 p-3 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="text-text-muted">Tênis</span>
        <span className="text-text">{sneaker ? sneaker.nome : 'Tênis branco'}</span>
      </div>
      {sneakerReferences.length > 0 && (
        <p className="mt-0.5 truncate text-right text-[10px] text-text-muted/70">Outras opções: {sneakerReferences.slice(0, 2).join(' · ')}</p>
      )}
      {accessoryPicks.length > 0 &&
        accessoryPicks.map((pick) => (
          <div key={pick.accessory.id} className="mt-1 flex items-center justify-between gap-2">
            <span className="text-text-muted">Acessório</span>
            <span className="text-text">{accessoryDisplayName(pick.accessory)}</span>
          </div>
        ))}
      <div className="mt-2 flex items-center justify-between gap-2 border-t border-border/60 pt-1.5">
        <span className="text-[10px] uppercase tracking-wide text-text-muted">Toque final</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-text-muted">{perfumeLabel}</span>
          {perfumes.length > 0 && (
            <button onClick={() => setPickerOpen((v) => !v)} className="-my-1 px-1 py-1.5 text-[10px] font-medium text-accent hover:underline">
              trocar
            </button>
          )}
        </div>
      </div>
      {suggestion.referencias.length > 0 && (
        <p className="mt-0.5 truncate text-right text-[10px] text-text-muted/70">Outras opções: {suggestion.referencias.slice(0, 2).join(' · ')}</p>
      )}
      {pickerOpen && (
        <select
          value={overrideId ?? ''}
          onChange={(e) => {
            setOverrideId(e.target.value || null)
            setPickerOpen(false)
          }}
          className="mt-2 w-full rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-xs text-text focus:border-accent focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <option value="">Sugestão automática ({suggestion.owned[0]?.nome ?? suggestion.familia})</option>
          {perfumes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
      )}
      <p className="mt-2 text-[11px] leading-relaxed text-text-muted">{justification}</p>
      {accessoryPicks[0] && <p className="mt-1 text-[11px] leading-relaxed text-text-muted">{accessoryJustification(accessoryPicks[0])}</p>}
    </div>
  )
}

function MatchResultCard({ result, context, weatherBias, onSelectWatch, favorites, onToggleFavorite, onLogFeedback, sneakers, perfumes, accessories, outfit, vibeId }) {
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
      <ResultBundle watch={watch} weatherBias={weatherBias} context={context} sneakers={sneakers} perfumes={perfumes} accessories={accessories} outfit={outfit} vibeId={vibeId} />
      <div className="flex items-center justify-between gap-2 px-1">
        <button onClick={() => setExpanded((v) => !v)} className="text-[11px] font-medium text-text-muted transition hover:text-text">
          {expanded ? 'Ocultar motivos' : 'Por que escolhi este?'} · <span className="text-accent">{band.label}</span>
        </button>
        <FeedbackButtons result={result} context={context} onLogFeedback={onLogFeedback} />
      </div>
      {expanded && <MatchExplanation subScores={subScores} reasons={reasons} />}
    </div>
  )
}

export default function MatchResults({ results, context, weatherBias, onSelectWatch, favorites, onToggleFavorite, onLogFeedback, sneakers, perfumes, accessories, outfit, vibeId }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-text-muted">
        {results.length} {results.length === 1 ? 'resultado' : 'resultados'}, do que mais pro que menos combina
      </p>
      {results.map((result) => (
        <MatchResultCard
          key={result.watch.id}
          result={result}
          context={context}
          weatherBias={weatherBias}
          onSelectWatch={onSelectWatch}
          favorites={favorites}
          onToggleFavorite={onToggleFavorite}
          onLogFeedback={onLogFeedback}
          sneakers={sneakers}
          perfumes={perfumes}
          accessories={accessories}
          outfit={outfit}
          vibeId={vibeId}
        />
      ))}
    </div>
  )
}
