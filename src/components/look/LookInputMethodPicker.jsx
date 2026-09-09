function MethodCard({ icon, title, subtitle, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-1 flex-col items-center gap-2 rounded-2xl border border-white/10 bg-neutral-900/60 p-5 text-center transition hover:border-amber-400/40 hover:bg-neutral-900"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400/10 text-amber-400">{icon}</div>
      <p className="text-sm font-semibold text-neutral-100">{title}</p>
      <p className="text-[11px] text-neutral-500">{subtitle}</p>
    </button>
  )
}

// Primeiro passo do fluxo manual: em vez de despejar 4 cards cheios de
// controles de uma vez, pergunta como a pessoa prefere informar o look —
// só then revela o próximo passo (progressive disclosure).
export default function LookInputMethodPicker({ onPickPhoto, onPickManual }) {
  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-neutral-100">Como você quer informar seu look?</p>
      <div className="flex gap-3">
        <MethodCard
          onClick={onPickPhoto}
          title="Fotografar meu look"
          subtitle="Estimativa automática por foto"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h1.5l1-1.5h9l1 1.5H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <circle cx="12" cy="13.5" r="3.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
        <MethodCard
          onClick={onPickManual}
          title="Informar manualmente"
          subtitle="Escolhe cor e tipo de cada peça"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          }
        />
      </div>
    </div>
  )
}
