import { useTheme } from '../hooks/useTheme.js'

const ICON_CLASS = 'h-4 w-4'

function SunIcon() {
  return (
    <svg className={ICON_CLASS} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="4.2" />
      <path
        strokeLinecap="round"
        d="M12 2.5v2.3M12 19.2v2.3M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2.5 12h2.3M19.2 12h2.3M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg className={ICON_CLASS} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z" />
    </svg>
  )
}

function SystemIcon() {
  return (
    <svg className={ICON_CLASS} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="4.5" width="18" height="12" rx="1.5" />
      <path strokeLinecap="round" d="M8.5 20h7M12 16.5V20" />
    </svg>
  )
}

const THEME_META = {
  light: { Icon: SunIcon, label: 'Tema: Claro' },
  dark: { Icon: MoonIcon, label: 'Tema: Escuro' },
  system: { Icon: SystemIcon, label: 'Tema: Sistema' },
}

// Ciclo Sistema → Claro → Escuro → Sistema. Mostra o ícone do estado
// ATUAL; tocar avança pro próximo — sem menu, sem tela de config
// própria, só um botão a mais no header ao lado do de backup.
export default function ThemeToggle() {
  const { theme, cycleTheme } = useTheme()
  const { Icon, label } = THEME_META[theme ?? 'system']

  return (
    <button
      onClick={cycleTheme}
      aria-label={`${label} — toca pra trocar`}
      title={label}
      className="rounded-full border border-border bg-surface-2 p-2 text-text-muted transition hover:bg-surface-3 hover:text-text"
    >
      <Icon />
    </button>
  )
}
