import { useState } from 'react'
import { GARMENTS } from '../../lib/matchEngine.js'
import LookInputMethodPicker from './LookInputMethodPicker.jsx'
import PhotoLookDetector from './PhotoLookDetector.jsx'
import GarmentSelector from './GarmentSelector.jsx'

function hasAnyColor(outfit) {
  return GARMENTS.some((g) => outfit[g.key]?.colorId)
}

// Dono do "como" (foto vs. manual) — se o outfit já tem alguma cor
// (voltando de outra aba, por exemplo), pula direto pro editor manual já
// preenchido em vez de perguntar de novo.
export default function LookInputSection({ outfit, onOutfitChange, sneakers, context, weatherBias, personalBias }) {
  const [method, setMethod] = useState(() => (hasAnyColor(outfit) ? 'manual' : null))

  if (method === null) {
    return <LookInputMethodPicker onPickPhoto={() => setMethod('foto')} onPickManual={() => setMethod('manual')} />
  }

  return (
    <div className="space-y-3">
      <button onClick={() => setMethod(null)} className="text-[11px] font-medium text-neutral-500 transition hover:text-neutral-300">
        ← Mudar forma de entrada
      </button>
      {method === 'foto' && <PhotoLookDetector outfit={outfit} onOutfitChange={onOutfitChange} onDone={() => setMethod('manual')} />}
      {method === 'manual' && (
        <GarmentSelector
          outfit={outfit}
          onOutfitChange={onOutfitChange}
          sneakers={sneakers}
          context={context}
          weatherBias={weatherBias}
          personalBias={personalBias}
        />
      )}
    </div>
  )
}
