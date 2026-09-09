import { CONTEXTS } from '../lib/matchEngine.js'
import { buildMoodeHistory } from '../lib/moodeHistory.js'

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  const label = date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short', timeZone: 'UTC' })
  return label[0].toUpperCase() + label.slice(1)
}

function MoodeEntry({ entry, onUseAgain, onCreateVariation }) {
  const { watch, date, context, score } = entry
  const contextLabel = CONTEXTS.find((c) => c.id === context)?.label

  return (
    <div className="rounded-xl border border-border bg-surface-2 p-3.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">{formatDate(date)}</p>
        {contextLabel && <p className="text-[11px] font-medium text-accent">{contextLabel}</p>}
      </div>
      <div className="mt-2 flex items-center gap-3">
        <span
          className="h-10 w-10 shrink-0 rounded-full ring-1 ring-border"
          style={{ background: watch.hexes.length > 1 ? `conic-gradient(${watch.hexes[0]} 0% 50%, ${watch.hexes[1]} 50% 100%)` : watch.hexes[0] }}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text">{watch.nome}</p>
          {score != null && <p className="text-xs text-text-muted">{score} de match nesse dia</p>}
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => onUseAgain(entry)}
          className="flex-1 rounded-full border border-border bg-surface px-3 py-1.5 text-[11px] font-semibold text-text transition hover:bg-surface-3"
        >
          Usar de novo
        </button>
        <button
          onClick={() => onCreateVariation(entry)}
          className="flex-1 rounded-full border border-border bg-surface px-3 py-1.5 text-[11px] font-semibold text-text transition hover:bg-surface-3"
        >
          Criar variação
        </button>
      </div>
    </div>
  )
}

// "Meus Moodes" — cada dia que você usou algo vira um registro aqui.
// Deriva de history + feedback (ver moodeHistory.js) — nunca um
// armazenamento próprio, então nunca pode desalinhar do que realmente
// aconteceu.
export default function MeusMoodesScreen({ history, feedback, collection, onUseAgain, onCreateVariation }) {
  const entries = buildMoodeHistory(history, feedback, collection)

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">Histórico</p>
        <h1 className="mt-1 font-serif text-2xl text-text">Meus Moodes</h1>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-text-muted">
          Ainda sem nenhum MOODE registrado. Toque em "Vou usar" na Home quando usar um look — ele aparece aqui.
        </div>
      ) : (
        <div className="space-y-2.5">
          {entries.map((entry, i) => (
            <MoodeEntry key={`${entry.watch.id}-${entry.date}-${i}`} entry={entry} onUseAgain={onUseAgain} onCreateVariation={onCreateVariation} />
          ))}
        </div>
      )}
    </div>
  )
}
