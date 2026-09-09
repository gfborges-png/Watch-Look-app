import { COLOR_FILTERS, COLOR_LABELS, STYLE_FILTERS, STYLE_LABELS } from '../lib/outfitEngine.js'

export function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
        active
          ? 'bg-amber-400 text-neutral-950'
          : 'border border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  )
}

export default function FilterBar({
  query,
  onQueryChange,
  colorFilter,
  onColorChange,
  styleFilter,
  onStyleChange,
  favoritesOnly,
  onFavoritesOnlyChange,
}) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
        </svg>
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          type="text"
          placeholder="Buscar relógio por nome..."
          className="w-full rounded-xl border border-white/10 bg-neutral-900/60 py-2.5 pl-9 pr-3 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-amber-400/60 focus:outline-none"
        />
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [mask-image:linear-gradient(to_right,transparent,black_16px,black_calc(100%-16px),transparent)]">
        <Chip active={colorFilter === 'todos'} onClick={() => onColorChange('todos')}>
          Todas as cores
        </Chip>
        {COLOR_FILTERS.map((c) => (
          <Chip key={c} active={colorFilter === c} onClick={() => onColorChange(c)}>
            {COLOR_LABELS[c]}
          </Chip>
        ))}
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [mask-image:linear-gradient(to_right,transparent,black_16px,black_calc(100%-16px),transparent)]">
        <Chip active={styleFilter === 'todos'} onClick={() => onStyleChange('todos')}>
          Todos os estilos
        </Chip>
        {STYLE_FILTERS.map((s) => (
          <Chip key={s} active={styleFilter === s} onClick={() => onStyleChange(s)}>
            {STYLE_LABELS[s]}
          </Chip>
        ))}
        <Chip active={favoritesOnly} onClick={() => onFavoritesOnlyChange(!favoritesOnly)}>
          ♥ Favoritos
        </Chip>
      </div>
    </div>
  )
}
