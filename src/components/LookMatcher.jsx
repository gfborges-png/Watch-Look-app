import { useMemo } from 'react'
import { watches } from '../data/watches.js'
import { LOOK_COLORS, CONTEXTS, GARMENTS, matchWatchesToLook } from '../lib/matchEngine.js'
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
        </div>
      )}
    </div>
  )
}

export default function LookMatcher({
  onSelectWatch,
  outfit,
  onOutfitChange,
  context,
  onContextChange,
  recentIds,
  favorites,
  onToggleFavorite,
}) {
  const results = useMemo(() => matchWatchesToLook(watches, outfit, context, recentIds), [outfit, context, recentIds])

  const hasSelection = GARMENTS.some((g) => {
    const piece = outfit[g.key]
    return (!g.optional || piece.enabled) && piece.colorId
  })
  const topResults = hasSelection ? results.filter((r) => r.score > 0).slice(0, 5) : []

  return (
    <div className="space-y-5">
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
    </div>
  )
}
