import { useMemo } from 'react'
import { suggestPerfume } from '../../lib/perfumeEngine.js'

export default function PerfumeRecommendation({ weatherBias, context, ownedPerfumes }) {
  const p = useMemo(() => suggestPerfume({ weatherBias, context, ownedPerfumes }), [weatherBias, context, ownedPerfumes])
  return (
    <div className="rounded-2xl border border-amber-400/20 bg-gradient-to-br from-neutral-900/70 to-neutral-900/30 p-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400/10">
          <svg className="h-4.5 w-4.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 2h6M10 2v3.3c0 .5-.2 1-.55 1.37L7.1 9.2A3 3 0 006 11.4V20a2 2 0 002 2h8a2 2 0 002-2v-8.6a3 3 0 00-1.1-2.2L14.55 6.7A2 2 0 0114 5.3V2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.2 13.5h9.6" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-neutral-100">Perfume sugerido</p>
          <p className="text-[11px] text-neutral-500">pro clima e ocasião de cima</p>
        </div>
      </div>

      <p className="mt-4 text-lg font-bold leading-tight text-amber-400">{p.familia}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {p.descritores.map((d) => (
          <span key={d} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-neutral-300">
            {d}
          </span>
        ))}
      </div>

      <p className="mt-3 text-xs leading-relaxed text-neutral-400">{p.porque}</p>

      {p.owned.length > 0 && (
        <div className="mt-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-400">Da sua coleção</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {p.owned.map((o) => (
              <span key={o.id} className="rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-semibold text-neutral-950">
                {o.nome}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Referências reais</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {p.referencias.map((r) => (
            <span
              key={r}
              className="rounded-full border border-amber-400/25 bg-amber-400/10 px-2.5 py-1 text-[11px] font-medium text-amber-300"
            >
              {r}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-black/30 p-3 text-xs text-neutral-400">
        <p>{p.intensidade}</p>
        {p.evitar && <p className="mt-1 text-neutral-500">{p.evitar}</p>}
        {p.climaNota && <p className="mt-1 text-amber-400/80">{p.climaNota}</p>}
      </div>
    </div>
  )
}
