import { useMemo } from 'react'
import { watches } from '../data/watches.js'
import { LOOK_COLORS, CONTEXTS, matchWatchesToLook } from '../lib/matchEngine.js'
import { Chip } from './FilterBar.jsx'
import WatchCard from './WatchCard.jsx'

const MAX_COLORS = 3

export default function LookMatcher({ onSelectWatch, selectedColors, onColorsChange, context, onContextChange }) {
  const toggleColor = (id) => {
    onColorsChange((prev) => {
      if (prev.includes(id)) return prev.filter((c) => c !== id)
      if (prev.length >= MAX_COLORS) return prev
      return [...prev, id]
    })
  }

  const results = useMemo(() => matchWatchesToLook(watches, selectedColors, context), [selectedColors, context])

  const hasSelection = selectedColors.length > 0
  const topResults = hasSelection ? results.filter((r) => r.score > 0).slice(0, 5) : []

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
          Cores do seu look de hoje <span className="text-neutral-600">(até {MAX_COLORS})</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {LOOK_COLORS.map((c) => {
            const active = selectedColors.includes(c.id)
            return (
              <button
                key={c.id}
                onClick={() => toggleColor(c.id)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? 'bg-amber-400 text-neutral-950'
                    : 'border border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10'
                }`}
              >
                <span
                  className="h-3 w-3 rounded-full ring-1 ring-black/20"
                  style={{ background: c.hex }}
                />
                {c.label}
              </button>
            )
          })}
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
            Escolha pelo menos uma cor do seu look pra ver quais relógios combinam.
          </div>
        ) : topResults.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-neutral-500">
            Nenhum match forte com essas cores. Tenta um mostrador neutro (preto, branco ou prata) — combina com qualquer look.
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-neutral-500">
              {topResults.length} {topResults.length === 1 ? 'relógio combina' : 'relógios combinam'} com esse look
            </p>
            {topResults.map(({ watch, reasons }) => (
              <WatchCard
                key={watch.id}
                watch={watch}
                onClick={() => onSelectWatch(watch.id)}
                reason={reasons[0] ? reasons[0][0].toUpperCase() + reasons[0].slice(1) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
