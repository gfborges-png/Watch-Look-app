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
      className="shrink-0 rounded-full p-1 text-neutral-500 transition hover:text-amber-400"
    >
      <svg
        className={`h-4 w-4 ${active ? 'fill-amber-400 text-amber-400' : 'fill-none'}`}
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
      className="group flex w-full cursor-pointer items-center gap-4 rounded-2xl border border-white/10 bg-neutral-900/60 p-4 text-left transition hover:border-white/25 hover:bg-neutral-900 active:scale-[0.99]"
    >
      <ColorSwatch hexes={watch.hexes} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-neutral-100">{watch.nome}</p>
        <p className="mt-0.5 truncate text-xs text-neutral-400">{watch.mostrador}</p>
        {reason ? (
          <p className="mt-1 truncate text-xs text-amber-400/90">{reason}</p>
        ) : (
          <p className="mt-0.5 truncate text-xs text-neutral-500">{watch.pulseira}</p>
        )}
        {typeof percent === 'number' && (
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-amber-400" style={{ width: `${percent}%` }} />
            </div>
            <span className="text-[11px] font-semibold tabular-nums text-neutral-400">{percent}%</span>
          </div>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-neutral-300">
          {COLOR_LABELS[watch.cor]}
        </span>
        {onToggleFavorite && <HeartButton active={isFavorite} onToggle={onToggleFavorite} />}
      </div>
    </div>
  )
}
