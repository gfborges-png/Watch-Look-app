import { useId, useState } from 'react'
import { LOOK_COLORS, GARMENTS } from '../../lib/matchEngine.js'
import { detectDominantColorId, closestLookColorId } from '../../lib/colorDetect.js'
import { Chip } from '../FilterBar.jsx'

const MANDATORY_ORDER = ['camisa', 'calca', 'calcado']

// Quais peças já podem aparecer: revela a próxima peça obrigatória só
// depois que a anterior tiver cor — a jaqueta (opcional) aparece por
// último, depois que as três obrigatórias já estiverem visíveis.
function visibleGarmentKeys(outfit) {
  const keys = []
  for (const key of MANDATORY_ORDER) {
    keys.push(key)
    if (!outfit[key]?.colorId) break
  }
  if (keys.length === MANDATORY_ORDER.length) keys.push('jaqueta')
  return keys
}

function ColorRow({ colorId, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {LOOK_COLORS.map((c) => {
        const active = colorId === c.id
        return (
          <button
            key={c.id}
            onClick={() => onChange(active ? null : c.id)}
            title={c.label}
            aria-label={c.label}
            aria-pressed={active}
            className={`h-7 w-7 shrink-0 rounded-full ring-2 transition ${
              active ? 'ring-amber-400 scale-110' : 'ring-transparent hover:ring-white/30'
            }`}
            style={{ background: c.hex }}
          />
        )
      })}
    </div>
  )
}

function TipoRow({ tipos, tipo, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tipos.map((t) => (
        <Chip key={t} active={tipo === t} onClick={() => onChange(tipo === t ? null : t)}>
          {t}
        </Chip>
      ))}
    </div>
  )
}

function PhotoDetectButton({ onDetected }) {
  const [status, setStatus] = useState('idle') // 'idle' | 'loading' | 'error'
  const inputId = useId()

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setStatus('loading')
    try {
      const colorId = await detectDominantColorId(file)
      onDetected(colorId)
      setStatus('idle')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor={inputId}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-neutral-300 transition hover:bg-white/10"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h1.5l1-1.5h9l1 1.5H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <circle cx="12" cy="13.5" r="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {status === 'loading' ? 'Detectando...' : 'Detectar cor por foto'}
      </label>
      <input id={inputId} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
      {status === 'error' && <span className="text-xs text-red-400">Não deu pra ler essa foto</span>}
    </div>
  )
}

function MeusTenisRow({ sneakers, onPick }) {
  if (!sneakers || sneakers.length === 0) return null
  return (
    <div>
      <p className="mb-1.5 text-[11px] uppercase tracking-wide text-neutral-500">Meus tênis</p>
      <div className="flex flex-wrap gap-1.5">
        {sneakers.map((s) => (
          <button
            key={s.id}
            onClick={() => onPick(s)}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-neutral-300 transition hover:bg-white/10"
          >
            <span
              className="h-3 w-3 shrink-0 rounded-full ring-1 ring-white/20"
              style={{
                background: s.hexes.length > 1 ? `conic-gradient(${s.hexes[0]} 0% 50%, ${s.hexes[1]} 50% 100%)` : s.hexes[0],
              }}
            />
            {s.nome}
          </button>
        ))}
      </div>
    </div>
  )
}

function GarmentSection({ garment, piece, onChange, sneakers }) {
  const setColor = (colorId) => onChange({ ...piece, colorId })
  const setTipo = (tipo) => onChange({ ...piece, tipo })
  const setModelo = (modelo) => onChange({ ...piece, modelo })
  const pickSneaker = (s) => onChange({ ...piece, colorId: closestLookColorId(s.hexes[0]), modelo: s.nome, tipo: s.tipo })

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-neutral-100">{garment.label}</p>
        {garment.optional && (
          <div className="flex gap-1.5">
            <Chip active={piece.enabled} onClick={() => onChange({ ...piece, enabled: true })}>
              Com jaqueta
            </Chip>
            <Chip active={!piece.enabled} onClick={() => onChange({ enabled: false, colorId: null, tipo: null })}>
              Sem jaqueta
            </Chip>
          </div>
        )}
      </div>

      {(!garment.optional || piece.enabled) && (
        <div className="space-y-2.5">
          {garment.key === 'calcado' && <MeusTenisRow sneakers={sneakers} onPick={pickSneaker} />}
          {garment.hasModel && (
            <input
              type="text"
              value={piece.modelo ?? ''}
              onChange={(e) => setModelo(e.target.value)}
              placeholder={garment.modelPlaceholder}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-amber-400/60 focus:outline-none"
            />
          )}
          <ColorRow colorId={piece.colorId} onChange={setColor} />
          <TipoRow tipos={garment.tipos} tipo={piece.tipo} onChange={setTipo} />
          <PhotoDetectButton onDetected={setColor} />
        </div>
      )}
    </div>
  )
}

// Entrada manual do look, peça por peça — revela a próxima peça só
// depois que a anterior estiver preenchida (progressive disclosure),
// pra não jogar 4 cards cheios de controles na tela de uma vez. Derivado
// direto do outfit a cada render — sem estado próprio, sem efeito.
export default function GarmentSelector({ outfit, onOutfitChange, sneakers }) {
  const revealed = visibleGarmentKeys(outfit)
  const visibleGarments = GARMENTS.filter((g) => revealed.includes(g.key))

  return (
    <div className="space-y-3">
      {visibleGarments.map((garment) => (
        <GarmentSection
          key={garment.key}
          garment={garment}
          piece={outfit[garment.key]}
          onChange={(next) => onOutfitChange({ ...outfit, [garment.key]: next })}
          sneakers={sneakers}
        />
      ))}
    </div>
  )
}
