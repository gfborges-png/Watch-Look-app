import { useId, useMemo, useState } from 'react'
import { paletteGroup } from '../../lib/outfitEngine.js'

export default function ChoiceFeedback({ watches, results, topResults, context, onLogChoice }) {
  const [selectedId, setSelectedId] = useState('')
  const [logged, setLogged] = useState(false)
  const selectId = useId()

  const sorted = useMemo(() => [...watches].sort((a, b) => a.nome.localeCompare(b.nome)), [watches])
  const entry = selectedId ? results.find((r) => r.watch.id === selectedId) : null
  const wasSuggested = selectedId ? topResults.some((r) => r.watch.id === selectedId) : false

  const handleChange = (e) => {
    setSelectedId(e.target.value)
    setLogged(false)
  }

  const handleLog = () => {
    if (!entry) return
    onLogChoice({
      watchId: entry.watch.id,
      group: paletteGroup(entry.watch.cor),
      match: entry.match,
      context,
      wasSuggested,
    })
    setLogged(true)
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-4">
      <p className="text-xs text-neutral-500">
        Escolheu outro relógio, mesmo sem eu ter sugerido? Conta pra mim — uso isso pra calibrar as próximas sugestões.
      </p>
      <select
        id={selectId}
        value={selectedId}
        onChange={handleChange}
        className="mt-3 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-neutral-100 focus:border-amber-400/60 focus:outline-none"
      >
        <option value="">Selecione um relógio da coleção...</option>
        {sorted.map((w) => (
          <option key={w.id} value={w.id}>
            {w.nome}
          </option>
        ))}
      </select>

      {entry && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-amber-400" style={{ width: `${entry.match}%` }} />
            </div>
            <span className="text-xs font-semibold tabular-nums text-neutral-400">
              {entry.match} — {entry.band.label}
            </span>
          </div>
          <p className="text-xs text-neutral-500">
            {wasSuggested ? 'Estava entre os sugeridos.' : 'Fora do top sugerido — anotado, isso pesa mais no aprendizado.'}
            {entry.reasons[0] && ` ${entry.reasons[0][0].toUpperCase()}${entry.reasons[0].slice(1)}.`}
          </p>
          <button
            onClick={handleLog}
            className="w-full rounded-full bg-amber-400 px-3 py-2 text-xs font-semibold text-neutral-950 transition hover:bg-amber-300"
          >
            {logged ? '✓ Registrado' : 'Registrar essa escolha'}
          </button>
        </div>
      )}
    </div>
  )
}
