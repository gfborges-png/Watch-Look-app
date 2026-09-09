import { useMemo } from 'react'
import { suggestPerfume } from '../../lib/perfumeEngine.js'

export default function PerfumeRecommendation({ weatherBias, context, ownedPerfumes }) {
  const p = useMemo(() => suggestPerfume({ weatherBias, context, ownedPerfumes }), [weatherBias, context, ownedPerfumes])
  return (
    <div className="rounded-2xl border border-accent/25 bg-gradient-to-br from-surface-2/70 to-surface-2/30 p-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10">
          <svg className="h-4.5 w-4.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 2h6M10 2v3.3c0 .5-.2 1-.55 1.37L7.1 9.2A3 3 0 006 11.4V20a2 2 0 002 2h8a2 2 0 002-2v-8.6a3 3 0 00-1.1-2.2L14.55 6.7A2 2 0 0114 5.3V2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.2 13.5h9.6" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-text">Perfume sugerido</p>
          <p className="text-[11px] text-text-muted">pro clima e ocasião de cima</p>
        </div>
      </div>

      <p className="mt-4 text-lg font-bold leading-tight text-accent">{p.familia}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {p.descritores.map((d) => (
          <span key={d} className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[11px] text-text-muted">
            {d}
          </span>
        ))}
      </div>

      <p className="mt-3 text-xs leading-relaxed text-text-muted">{p.porque}</p>

      {p.owned.length > 0 && (
        <div className="mt-3 rounded-xl border border-accent/35 bg-accent/10 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">Da sua coleção</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {p.owned.map((o) => (
              <span key={o.id} className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-bone">
                {o.nome}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Referências reais</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {p.referencias.map((r) => (
            <span
              key={r}
              className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[11px] font-medium text-accent"
            >
              {r}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-surface-2 p-3 text-xs text-text-muted">
        <p>{p.intensidade}</p>
        {p.evitar && <p className="mt-1 text-text-muted">{p.evitar}</p>}
        {p.climaNota && <p className="mt-1 text-accent/80">{p.climaNota}</p>}
      </div>
    </div>
  )
}
