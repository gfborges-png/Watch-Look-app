import ColorSwatch from './ColorSwatch.jsx'
import { COLOR_LABELS } from '../lib/outfitEngine.js'

export default function WatchCard({ watch, onClick, reason }) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-neutral-900/60 p-4 text-left transition hover:border-white/25 hover:bg-neutral-900 active:scale-[0.99]"
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
      </div>
      <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-neutral-300">
        {COLOR_LABELS[watch.cor]}
      </span>
    </button>
  )
}
