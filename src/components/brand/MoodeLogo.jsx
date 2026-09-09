import MoodeSymbol from './MoodeSymbol.jsx'

// Primary: MOODE com os dois "O" substituídos pelo símbolo interligado
// (o lockup oficial — usado no header, splash, ícone institucional).
// Secondary: MOODE em texto puro, pra contextos onde o símbolo pesaria
// (rodapés, menções inline). Tudo em `em`, então escala com font-size
// do elemento pai em vez de precisar de props de tamanho.
export default function MoodeLogo({ variant = 'primary', className = '', tagline = false }) {
  if (variant === 'secondary') {
    return <span className={`font-semibold tracking-[0.14em] ${className}`}>MOODE</span>
  }

  return (
    <span className={`inline-flex flex-col ${className}`}>
      <span className="inline-flex items-center font-semibold tracking-[0.02em]">
        <span>M</span>
        <MoodeSymbol className="mx-[0.02em] h-[0.6em] w-[0.92em] translate-y-[0.03em]" title="MOODE" />
        <span>DE</span>
      </span>
      {tagline && <span className="mt-1.5 text-[0.34em] font-normal uppercase tracking-[0.22em] text-text-muted">Dress your mood.</span>}
    </span>
  )
}
