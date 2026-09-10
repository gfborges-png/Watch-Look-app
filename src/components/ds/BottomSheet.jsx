import { useEffect, useRef } from 'react'

const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

// Sheet genérico — usado pelo seletor de contexto na Home ("Qual é o
// MOODE?") e reaproveitável em qualquer outro lugar que precisar de
// uma escolha rápida sem sair da tela. Fecha com ESC, clique no fundo,
// ou o próprio chamador via onClose. Ao abrir, o foco vai pro próprio
// diálogo (anuncia o título pra quem usa leitor de tela) e fica preso
// lá dentro (Tab não escapa pro conteúdo por trás); ao fechar, volta
// pro elemento que abriu o sheet — sem isso, o teclado "perderia o
// lugar" toda vez que um sheet fosse aberto e fechado.
export default function BottomSheet({ open, onClose, title, children }) {
  const dialogRef = useRef(null)
  const previouslyFocusedRef = useRef(null)

  useEffect(() => {
    if (!open) return

    previouslyFocusedRef.current = document.activeElement
    dialogRef.current?.focus()

    const onKey = (e) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab' || !dialogRef.current) return
      const focusables = dialogRef.current.querySelectorAll(FOCUSABLE_SELECTOR)
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      previouslyFocusedRef.current?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center">
      <button aria-label="Fechar" className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="relative z-10 w-full max-w-2xl rounded-t-2xl border-t border-border bg-surface p-5 focus:outline-none"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.25rem)' }}
      >
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-border" />
        {title && <p className="mb-3 text-sm font-semibold text-text">{title}</p>}
        {children}
      </div>
    </div>
  )
}
