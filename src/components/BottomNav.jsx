const TABS = [
  { id: 'hoje', label: 'Hoje' },
  { id: 'colecao', label: 'Coleção' },
  { id: 'montar', label: 'Montar' },
  { id: 'guardaroupa', label: 'Guarda-roupa' },
]

function NavIcon({ id }) {
  const cls = 'h-5 w-5 shrink-0'
  if (id === 'hoje') {
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="4.2" />
        <path
          strokeLinecap="round"
          d="M12 2.5v2.3M12 19.2v2.3M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2.5 12h2.3M19.2 12h2.3M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6"
        />
      </svg>
    )
  }
  if (id === 'colecao') {
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <rect x="3.5" y="3.5" width="7.2" height="7.2" rx="1.5" />
        <rect x="13.3" y="3.5" width="7.2" height="7.2" rx="1.5" />
        <rect x="3.5" y="13.3" width="7.2" height="7.2" rx="1.5" />
        <rect x="13.3" y="13.3" width="7.2" height="7.2" rx="1.5" />
      </svg>
    )
  }
  if (id === 'montar') {
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 4L4 7l2.5 2.5L8 8v12h8V8l1.5 1.5L20 7l-4-3-2 2h-4l-2-2z" />
      </svg>
    )
  }
  return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="4.5" r="1.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v2.5M3.5 20.5L12 8.5l8.5 12M7 15.5h10" />
    </svg>
  )
}

// Renderiza as duas variantes a partir de uma única fonte de verdade —
// cada viewport esconde a que não usa via classe responsiva. Precisa ser
// chamado FORA do <header> (que tem backdrop-blur): filter/backdrop-filter
// no ancestral vira containing block de `position: fixed`, e a barra
// mobile passaria a colar no rodapé do header em vez do rodapé da tela.
export default function BottomNav({ active, onChange }) {
  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 backdrop-blur md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto flex max-w-2xl items-stretch justify-around">
          {TABS.map((t) => {
            const isActive = active === t.id
            return (
              <button
                key={t.id}
                onClick={() => onChange(t.id)}
                aria-label={t.label}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 px-2 py-2.5 text-[10px] font-medium transition ${
                  isActive ? 'text-accent' : 'text-text-muted'
                }`}
              >
                <NavIcon id={t.id} />
                {t.label}
              </button>
            )
          })}
        </div>
      </nav>

      <div className="mx-auto hidden max-w-2xl gap-2 px-4 pb-3 md:flex">
        {TABS.map((t) => {
          const isActive = active === t.id
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                isActive ? 'bg-accent text-bone' : 'border border-border bg-surface-2 text-text-muted hover:bg-surface-3'
              }`}
            >
              <NavIcon id={t.id} />
              {t.label}
            </button>
          )
        })}
      </div>
    </>
  )
}
