const ICON_CLASS = 'h-4 w-4'

function IconOutra() {
  return (
    <svg className={ICON_CLASS} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 12a8 8 0 0114-5.3M20 12a8 8 0 01-14 5.3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 3v4h-4M6 21v-4h4" />
    </svg>
  )
}
function IconCasual() {
  return (
    <svg className={ICON_CLASS} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 15c2.5-4 13.5-4 16 0" />
    </svg>
  )
}
function IconSofisticado() {
  return (
    <svg className={ICON_CLASS} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 17L12 6l8 11" />
    </svg>
  )
}
function IconOusado() {
  return (
    <svg className={ICON_CLASS} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l6 9-6 9-6-9z" />
    </svg>
  )
}
function IconVariar() {
  return (
    <svg className={ICON_CLASS} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 2l4 4-4 4M3 12a8 8 0 0114-5.5M7 22l-4-4 4-4M21 12a8 8 0 01-14 5.5" />
    </svg>
  )
}

const ACTIONS = [
  { direction: 'outra', label: 'Outra opção', Icon: IconOutra },
  { direction: 'casual', label: 'Mais casual', Icon: IconCasual },
  { direction: 'sofisticado', label: 'Mais sofisticado', Icon: IconSofisticado },
  { direction: 'ousado', label: 'Mais ousado', Icon: IconOusado },
  { direction: 'variar', label: 'Quero variar', Icon: IconVariar },
]

// "Mude o MOODE" — chips editoriais com scroll horizontal, cada um com
// um ícone abstrato + label curto, em vez de uma grade de botões
// grandes. Some pra fora da viewport com um leve fade lateral.
export default function SwitchMoode({ onSelect }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">Mude o MOODE</p>
      <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1">
        {ACTIONS.map(({ direction, label, Icon }) => (
          <button
            key={direction}
            onClick={() => onSelect(direction)}
            className="flex shrink-0 flex-col items-center gap-1.5 rounded-2xl border border-border bg-surface-2 px-4 py-3 text-text-muted transition hover:border-accent/40 hover:text-text"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-3">
              <Icon />
            </span>
            <span className="whitespace-nowrap text-[11px] font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
