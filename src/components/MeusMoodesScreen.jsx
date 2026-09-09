import { CONTEXTS } from '../lib/matchEngine.js'
import { buildMoodeHistory } from '../lib/moodeHistory.js'

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  const label = date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short', timeZone: 'UTC' })
  return label[0].toUpperCase() + label.slice(1)
}

function HeartButton({ active, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label={active ? 'Remover dos Moodes favoritos' : 'Favoritar esse Moode'}
      aria-pressed={active}
      className="shrink-0 rounded-full p-1 text-text-muted transition hover:text-accent"
    >
      <svg className={`h-4 w-4 ${active ? 'fill-accent text-accent' : 'fill-none'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 20.6l-1.4-1.3C5.4 14.9 2 11.8 2 8.1 2 5.3 4.2 3 7 3c1.6 0 3.1.8 4 2 .9-1.2 2.4-2 4-2 2.8 0 5 2.3 5 5.1 0 3.7-3.4 6.8-8.6 11.2l-1.4 1.3z"
        />
      </svg>
    </button>
  )
}

function MoodeEntry({ entry, isFavorite, onToggleFavorite, onUseAgain, onCreateVariation }) {
  const { watch, date, context, score } = entry
  const contextLabel = CONTEXTS.find((c) => c.id === context)?.label

  return (
    <div className="rounded-xl border border-border bg-surface-2 p-3.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">{formatDate(date)}</p>
        <div className="flex items-center gap-1.5">
          {contextLabel && <p className="text-[11px] font-medium text-accent">{contextLabel}</p>}
          <HeartButton active={isFavorite} onClick={() => onToggleFavorite(entry)} />
        </div>
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
// aconteceu. Favoritar é um conjunto separado (favoriteLooks) do
// favorito por item que já existe na coleção — aqui é o dia inteiro.
export default function MeusMoodesScreen({ history, feedback, collection, favoriteLooks, onToggleFavoriteLook, onUseAgain, onCreateVariation }) {
  const entries = buildMoodeHistory(history, feedback, collection)
  const isFavorite = (entry) => favoriteLooks.some((f) => f.watchId === entry.watch.id && f.date === entry.date)
  const favoriteEntries = entries.filter(isFavorite)

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">Histórico</p>
        <h1 className="mt-1 font-serif text-2xl text-text">Meus Moodes</h1>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-text-muted">
          Ainda sem nenhum MOODE registrado. Toque em "Vou usar" na Home quando usar um look — ele aparece aqui.
        </div>
      ) : (
        <>
          {favoriteEntries.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">Moodes favoritos</p>
              <div className="space-y-2.5">
                {favoriteEntries.map((entry, i) => (
                  <MoodeEntry
                    key={`fav-${entry.watch.id}-${entry.date}-${i}`}
                    entry={entry}
                    isFavorite
                    onToggleFavorite={onToggleFavoriteLook}
                    onUseAgain={onUseAgain}
                    onCreateVariation={onCreateVariation}
                  />
                ))}
              </div>
            </div>
          )}
          <div>
            {favoriteEntries.length > 0 && <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">Todos</p>}
            <div className="space-y-2.5">
              {entries.map((entry, i) => (
                <MoodeEntry
                  key={`${entry.watch.id}-${entry.date}-${i}`}
                  entry={entry}
                  isFavorite={isFavorite(entry)}
                  onToggleFavorite={onToggleFavoriteLook}
                  onUseAgain={onUseAgain}
                  onCreateVariation={onCreateVariation}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
