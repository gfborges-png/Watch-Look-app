import { isForgotten, usageStats } from '../lib/rotationEngine.js'
import ColorSwatch from './ColorSwatch.jsx'

// Relógios parados há muito tempo (ou nunca registrados) — um empurrão
// visual pra lembrar que eles existem, sem esconder o resto da coleção.
export default function ForgottenWatches({ watches, history, onSelectWatch }) {
  const forgotten = watches
    .filter((w) => isForgotten(w.id, history))
    .sort((a, b) => usageStats(b.id, history).daysSinceWorn - usageStats(a.id, history).daysSinceWorn)
    .slice(0, 8)

  if (forgotten.length === 0) return null

  return (
    <div className="mb-4 rounded-2xl border border-border bg-surface-2/40 p-4">
      <p className="text-sm font-semibold text-text">Esquecidos na caixa</p>
      <p className="mt-0.5 text-xs text-text-muted">Relógios que estão pedindo pra sair um pouco.</p>
      <div className="mt-3 -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
        {forgotten.map((w) => {
          const { daysSinceWorn } = usageStats(w.id, history)
          return (
            <button
              key={w.id}
              onClick={() => onSelectWatch(w.id)}
              className="flex w-32 shrink-0 flex-col items-start gap-2 rounded-xl border border-border bg-surface-2 p-3 text-left transition hover:border-accent/40"
            >
              <ColorSwatch hexes={w.hexes} />
              <p className="line-clamp-2 text-xs font-semibold text-text">{w.nome}</p>
              <p className="text-[10px] text-accent/90">
                {daysSinceWorn === Infinity ? 'Nunca registrado' : `Há ${daysSinceWorn} dias`}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
