import { useId, useState } from 'react'
import { LOOK_COLORS } from '../../lib/matchEngine.js'
import { detectLookZones } from '../../lib/colorDetect.js'

const ZONE_LABELS = [
  { key: 'camisa', label: 'Parte superior' },
  { key: 'calca', label: 'Parte inferior' },
  { key: 'calcado', label: 'Tênis' },
]

function colorLabel(id) {
  return LOOK_COLORS.find((c) => c.id === id)?.label ?? '—'
}

// Foto do look inteiro é uma ESTIMATIVA por zonas da imagem, não
// reconhecimento real de peça de roupa (ver colorDetect.js) — por isso
// nunca aplica direto: sempre mostra o que entendeu primeiro ("Detectamos:
// ...") e só altera o outfit quando a pessoa confirma. "Confirmar" aplica
// as cores detectadas e segue pro editor manual (pra ajustar o que faltar,
// como tipo de peça); "Editar manualmente" ignora a detecção e manda pro
// mesmo editor do zero — nenhum dos dois caminhos é uma caixa-preta.
export default function PhotoLookDetector({ outfit, onOutfitChange, onDone }) {
  const [status, setStatus] = useState('idle') // 'idle' | 'loading' | 'detected' | 'error'
  const [zones, setZones] = useState(null)
  const inputId = useId()

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setStatus('loading')
    try {
      const result = await detectLookZones(file)
      setZones(result)
      setStatus('detected')
    } catch {
      setStatus('error')
    }
  }

  const applyZones = () => {
    onOutfitChange({
      ...outfit,
      camisa: zones.camisa ? { ...outfit.camisa, colorId: zones.camisa } : outfit.camisa,
      calca: zones.calca ? { ...outfit.calca, colorId: zones.calca } : outfit.calca,
      calcado: zones.calcado ? { ...outfit.calcado, colorId: zones.calcado } : outfit.calcado,
    })
  }

  if (status === 'detected' && zones) {
    return (
      <div className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-4">
        <p className="text-sm font-semibold text-amber-400">Detectamos:</p>
        <div className="mt-2 space-y-1.5">
          {ZONE_LABELS.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-neutral-500">{label}</span>
              <span className="flex items-center gap-1.5 text-neutral-200">
                <span
                  className="h-3 w-3 rounded-full ring-1 ring-white/20"
                  style={{ background: LOOK_COLORS.find((c) => c.id === zones[key])?.hex ?? 'transparent' }}
                />
                {colorLabel(zones[key])}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-neutral-500">
          Estimativa por zonas da foto, não reconhecimento real de roupa — confere se bateu certo.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => {
              applyZones()
              onDone()
            }}
            className="flex-1 rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-amber-300"
          >
            Confirmar
          </button>
          <button
            onClick={onDone}
            className="flex-1 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-neutral-300 transition hover:bg-white/10"
          >
            Editar manualmente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-dashed border-amber-400/30 bg-amber-400/5 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400/10">
          <svg className="h-4.5 w-4.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h1.5l1-1.5h9l1 1.5H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <circle cx="12" cy="13.5" r="3.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <label htmlFor={inputId} className="cursor-pointer text-sm font-semibold text-amber-400">
            {status === 'loading' ? 'Analisando a foto...' : 'Tirar ou escolher uma foto do look'}
          </label>
          <p className="mt-0.5 text-[11px] text-neutral-500">
            Funciona melhor com foto de corpo inteiro, de frente. A imagem nunca sai do seu aparelho.
          </p>
          {status === 'error' && <p className="mt-1 text-xs text-red-400">Não deu pra ler essa foto — tenta outra ou informa manualmente.</p>}
        </div>
      </div>
      <input id={inputId} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
    </div>
  )
}
