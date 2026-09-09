import MoodeSymbol from './brand/MoodeSymbol.jsx'

const TABS = [
  { id: 'hoje', label: 'Hoje' },
  { id: 'guardaroupa', label: 'Guarda-roupa' },
  { id: 'montar', label: 'Montar' },
  { id: 'historico', label: 'Histórico' },
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
  if (id === 'guardaroupa') {
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <rect x="3.5" y="3.5" width="7.2" height="7.2" rx="1.5" />
        <rect x="13.3" y="3.5" width="7.2" height="7.2" rx="1.5" />
        <rect x="3.5" y="13.3" width="7.2" height="7.2" rx="1.5" />
        <rect x="13.3" y="13.3" width="7.2" height="7.2" rx="1.5" />
      </svg>
    )
  }
  // historico
  return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="8.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5V12l3 2" />
    </svg>
  )
}

// O botão "Montar" ganha o símbolo da marca, um pouco elevado — a ação
// criativa central do app, não só mais um item de menu. Só esse, pra
// não "exagerar na marca" no resto da navegação.
function MontarButton({ active, onClick, variant }) {
  if (variant === 'mobile') {
    return (
      <button
        onClick={onClick}
        aria-label="Montar"
        aria-current={active ? 'page' : undefined}
        className="flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 px-2 py-2.5 text-[10px] font-medium"
      >
        <span
          className={`-mt-5 flex h-11 w-11 items-center justify-center rounded-full border transition ${
            active ? 'border-accent bg-accent text-bone' : 'border-border bg-surface text-text'
          }`}
        >
          <MoodeSymbol className="h-4 w-6" />
        </span>
        <span className={active ? 'text-accent' : 'text-text-muted'}>Montar</span>
      </button>
    )
  }
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
        active ? 'bg-accent text-bone' : 'border border-border bg-surface-2 text-text-muted hover:bg-surface-3'
      }`}
    >
      <MoodeSymbol className="h-3.5 w-5" />
      Montar
    </button>
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
            if (t.id === 'montar') return <MontarButton key={t.id} active={isActive} onClick={() => onChange(t.id)} variant="mobile" />
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
          if (t.id === 'montar') return <MontarButton key={t.id} active={isActive} onClick={() => onChange(t.id)} variant="desktop" />
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
