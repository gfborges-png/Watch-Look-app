import { useEffect } from 'react'

// Sheet genérico — usado pelo seletor de contexto na Home ("Qual é o
// MOODE?") e reaproveitável em qualquer outro lugar que precisar de
// uma escolha rápida sem sair da tela. Fecha com ESC, clique no fundo,
// ou o próprio chamador via onClose.
export default function BottomSheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center">
      <button aria-label="Fechar" className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 w-full max-w-2xl rounded-t-2xl border-t border-border bg-surface p-5"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.25rem)' }}
      >
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-border" />
        {title && <p className="mb-3 text-sm font-semibold text-text">{title}</p>}
        {children}
      </div>
    </div>
  )
}
