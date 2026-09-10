// O símbolo da marca: dois círculos interligados — MOOD ↔ MODE. Um
// círculo é você, o outro é o momento; a interseção é o seu MOODE.
// Abstrato de propósito (nada de cabide/camiseta/sparkle de IA) — tem
// que funcionar sozinho, em qualquer tamanho, como um símbolo de moda.
// `currentColor` deixa o tom decidido por quem usa (texto do header,
// ink no ícone claro, bone no escuro).
export default function MoodeSymbol({ className = 'h-6 w-9', title }) {
  return (
    <svg viewBox="0 0 64 40" className={className} aria-hidden={title ? undefined : true} role={title ? 'img' : undefined}>
      {title && <title>{title}</title>}
      <circle cx="22" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="5.5" />
      <circle cx="42" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="5.5" />
    </svg>
  )
}
