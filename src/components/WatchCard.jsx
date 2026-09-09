import ColorSwatch from './ColorSwatch.jsx'
import { COLOR_LABELS } from '../lib/outfitEngine.js'

function HeartButton({ active, onToggle }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
      }}
      aria-label={active ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      aria-pressed={active}
      className="shrink-0 rounded-full p-2 text-text-muted transition hover:text-accent"
    >
      <svg
        className={`h-4 w-4 ${active ? 'fill-accent text-accent' : 'fill-none'}`}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 20.6l-1.4-1.3C5.4 14.9 2 11.8 2 8.1 2 5.3 4.2 3 7 3c1.6 0 3.1.8 4 2 .9-1.2 2.4-2 4-2 2.8 0 5 2.3 5 5.1 0 3.7-3.4 6.8-8.6 11.2l-1.4 1.3z"
        />
      </svg>
    </button>
  )
}

export default function WatchCard({ watch, onClick, reason, percent, isFavorite, onToggleFavorite }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      className="group flex w-full cursor-pointer items-center gap-4 rounded-2xl border border-border bg-surface-2/60 p-4 text-left transition hover:border-white/25 hover:bg-surface-2 active:scale-[0.99]"
    >
      <ColorSwatch hexes={watch.hexes} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-text">{watch.nome}</p>
        <p className="mt-0.5 truncate text-xs text-text-muted">{watch.mostrador}</p>
        {reason ? (
          <p className="mt-1 truncate text-xs text-accent/90">{reason}</p>
        ) : (
          <p className="mt-0.5 truncate text-xs text-text-muted">{watch.pulseira}</p>
        )}
        {typeof percent === 'number' && (
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-3">
              <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
            </div>
            <span className="text-[11px] font-semibold tabular-nums text-text-muted">{percent}%</span>
          </div>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-text-muted">
          {COLOR_LABELS[watch.cor]}
        </span>
        {onToggleFavorite && <HeartButton active={isFavorite} onToggle={onToggleFavorite} />}
      </div>
    </div>
  )
}
