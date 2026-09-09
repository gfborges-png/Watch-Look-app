import { COLOR_FILTERS, COLOR_LABELS } from '../lib/outfitEngine.js'
import { WATCH_TYPES, BRACELET_MATERIALS } from '../lib/watchModel.js'
import { SORT_OPTIONS } from '../lib/collectionSort.js'

// type="button" é obrigatório aqui: sem ele, um <button> dentro de um
// <form> (SneakerForm, AccessoryForm) vira type="submit" por padrão do
// HTML — cada toque num Chip (tipo, estilo...) submeteria o formulário
// inteiro no estado em que estivesse naquele instante, em vez de só
// atualizar a seleção.
export function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 rounded-full px-3 py-2 text-xs font-medium transition ${
        active
          ? 'bg-accent text-bone'
          : 'border border-border bg-surface-2 text-text-muted hover:bg-surface-3'
      }`}
    >
      {children}
    </button>
  )
}

const selectClass =
  'rounded-lg border border-border bg-surface-2/60 px-2.5 py-1.5 text-xs text-text-muted focus:border-accent focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

export default function FilterBar({
  query,
  onQueryChange,
  colorFilter,
  onColorChange,
  typeFilter,
  onTypeChange,
  brandFilter,
  onBrandChange,
  brands,
  materialFilter,
  onMaterialChange,
  favoritesOnly,
  onFavoritesOnlyChange,
  sortBy,
  onSortChange,
}) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
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
          className="w-full rounded-xl border border-border bg-surface-2/60 py-2.5 pl-9 pr-3 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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
        <Chip active={typeFilter === 'todos'} onClick={() => onTypeChange('todos')}>
          Todos os tipos
        </Chip>
        {WATCH_TYPES.map((t) => (
          <Chip key={t.id} active={typeFilter === t.id} onClick={() => onTypeChange(t.id)}>
            {t.label}
          </Chip>
        ))}
        <Chip active={favoritesOnly} onClick={() => onFavoritesOnlyChange(!favoritesOnly)}>
          ♥ Favoritos
        </Chip>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select value={brandFilter} onChange={(e) => onBrandChange(e.target.value)} className={selectClass} aria-label="Filtrar por marca">
          <option value="todos">Todas as marcas</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <select value={materialFilter} onChange={(e) => onMaterialChange(e.target.value)} className={selectClass} aria-label="Filtrar por material da pulseira">
          <option value="todos">Todas as pulseiras</option>
          {BRACELET_MATERIALS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
        <select value={sortBy} onChange={(e) => onSortChange(e.target.value)} className={`${selectClass} ml-auto`} aria-label="Ordenar coleção">
          {SORT_OPTIONS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
