import { useId, useMemo, useState } from 'react'
import { LOOK_COLORS, GARMENTS, coloredActiveGarments } from '../../lib/matchEngine.js'
import { detectDominantColorId, closestLookColorId } from '../../lib/colorDetect.js'
import { pickBestSneakerForGarments } from '../../lib/sneakerMatch.js'
import { Chip } from '../FilterBar.jsx'

const MANDATORY_ORDER = ['camisa', 'calca', 'calcado']

// Peça "pronta" pra revelar a próxima: cor E tipo escolhidos (e, pra
// calçado, também o modelo — livre ou vindo de um tênis cadastrado
// aplicado via SneakerSuggestionField, que seta os três juntos numa
// tacada só). Antes só olhava a cor, então escolher só a cor já
// revelava a peça seguinte com tipo ainda em branco — trocado pra
// esperar a escolha inteira (item/tipo + cor + modelo) ficar completa.
function isGarmentReady(key, outfit) {
  const piece = outfit[key]
  if (!piece?.colorId || !piece?.tipo) return false
  const garment = GARMENTS.find((g) => g.key === key)
  if (garment?.hasModel && !piece.modelo?.trim()) return false
  return true
}

// Quais peças já podem aparecer: revela a próxima peça obrigatória só
// depois que a anterior estiver pronta — a jaqueta (opcional) aparece
// por último, depois que as três obrigatórias já estiverem visíveis.
function visibleGarmentKeys(outfit) {
  const keys = []
  for (const key of MANDATORY_ORDER) {
    keys.push(key)
    if (!isGarmentReady(key, outfit)) break
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
            className={`h-8 w-8 shrink-0 rounded-full ring-2 transition ${
              active ? 'ring-accent scale-110' : 'ring-transparent hover:ring-border'
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
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-text-muted transition hover:bg-surface-3"
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

function sneakerSwatchStyle(hexes) {
  return { background: hexes.length > 1 ? `conic-gradient(${hexes[0]} 0% 50%, ${hexes[1]} 50% 100%)` : hexes[0] }
}

// Em vez de escolher cor/tipo manualmente, sugere o tênis da coleção que
// melhor combina com o resto do look (e, quando a ocasião é conhecida,
// com o tipo apropriado) — igual ao relógio, que também é sugerido, não
// escolhido peça por peça. "Trocar" abre o catálogo inteiro pra escolher
// outro, se a sugestão não for a que a pessoa quer usar hoje.
function SneakerSuggestionField({ piece, onChange, sneakers, suggested }) {
  const [pickerOpen, setPickerOpen] = useState(false)

  const applySneaker = (s) => {
    onChange({ ...piece, colorId: closestLookColorId(s.hexes[0]), modelo: s.nome, tipo: s.tipo })
    setPickerOpen(false)
  }

  const currentHex = piece.colorId ? LOOK_COLORS.find((c) => c.id === piece.colorId)?.hex : null

  return (
    <div className="rounded-xl border border-border bg-surface-2 p-3">
      <p className="text-[11px] uppercase tracking-wide text-text-muted">{piece.modelo ? 'Tênis escolhido' : 'Tênis sugerido'}</p>

      {piece.modelo ? (
        <div className="mt-1 flex items-center gap-2 text-sm font-medium text-text">
          {currentHex && <span className="h-3 w-3 shrink-0 rounded-full ring-1 ring-border" style={{ background: currentHex }} />}
          <span className="truncate">{piece.modelo}</span>
        </div>
      ) : suggested ? (
        <button onClick={() => applySneaker(suggested)} className="mt-1 flex w-full items-center gap-2 text-left text-sm font-medium text-accent transition hover:opacity-80">
          <span className="h-3 w-3 shrink-0 rounded-full ring-1 ring-border" style={sneakerSwatchStyle(suggested.hexes)} />
          <span className="truncate">{suggested.nome}</span>
          <span className="ml-auto shrink-0 text-[11px] font-normal text-text-muted">usar esse</span>
        </button>
      ) : (
        <p className="mt-1 text-sm text-text-muted">Nenhum dos seus tênis cadastrados combina ainda.</p>
      )}

      <button onClick={() => setPickerOpen((v) => !v)} className="mt-1.5 text-[11px] font-medium text-accent hover:underline">
        {pickerOpen ? 'fechar' : 'trocar'}
      </button>

      {pickerOpen && (
        <select
          value=""
          onChange={(e) => {
            const s = sneakers.find((x) => x.id === e.target.value)
            if (s) applySneaker(s)
          }}
          className="mt-2 w-full rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-xs text-text focus:border-accent focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <option value="">Escolher outro tênis...</option>
          {sneakers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nome}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}

function GarmentSection({ garment, piece, onChange, sneakers, suggestedSneaker }) {
  const setColor = (colorId) => onChange({ ...piece, colorId })
  const setTipo = (tipo) => onChange({ ...piece, tipo })
  const setModelo = (modelo) => onChange({ ...piece, modelo })
  const isSneakerSlot = garment.key === 'calcado' && sneakers && sneakers.length > 0

  return (
    <div className="rounded-2xl border border-border bg-surface-2/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-text">{garment.label}</p>
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
          {isSneakerSlot ? (
            <SneakerSuggestionField piece={piece} onChange={onChange} sneakers={sneakers} suggested={suggestedSneaker} />
          ) : (
            <>
              {garment.hasModel && (
                <input
                  type="text"
                  value={piece.modelo ?? ''}
                  onChange={(e) => setModelo(e.target.value)}
                  placeholder={garment.modelPlaceholder}
                  className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                />
              )}
              <ColorRow colorId={piece.colorId} onChange={setColor} />
              <TipoRow tipos={garment.tipos} tipo={piece.tipo} onChange={setTipo} />
              <PhotoDetectButton onDetected={setColor} />
            </>
          )}
        </div>
      )}
    </div>
  )
}

// Entrada manual do look, peça por peça — revela a próxima peça só
// depois que a anterior estiver preenchida (progressive disclosure),
// pra não jogar 4 cards cheios de controles na tela de uma vez. Derivado
// direto do outfit a cada render — sem estado próprio, sem efeito.
export default function GarmentSelector({ outfit, onOutfitChange, sneakers, context, weatherBias, personalBias }) {
  const revealed = visibleGarmentKeys(outfit)
  const visibleGarments = GARMENTS.filter((g) => revealed.includes(g.key))

  const suggestedSneaker = useMemo(() => {
    if (!sneakers || sneakers.length === 0) return null
    const others = coloredActiveGarments(outfit).filter((g) => g.key !== 'calcado')
    return pickBestSneakerForGarments(sneakers, others, context, { weatherBias, personalBias })
  }, [sneakers, outfit, context, weatherBias, personalBias])

  const handleGarmentChange = (key, next) => {
    let nextOutfit = { ...outfit, [key]: next }
    // Ao terminar a calça (última peça obrigatória antes do tênis), já
    // aplica o tênis sugerido de cara — não faz sentido pedir mais um
    // clique pra algo que já dá pra inferir da própria coleção.
    if (key === 'calca' && next.colorId && !outfit.calcado?.modelo && sneakers && sneakers.length > 0) {
      const others = coloredActiveGarments(nextOutfit).filter((g) => g.key !== 'calcado')
      const best = pickBestSneakerForGarments(sneakers, others, context, { weatherBias, personalBias })
      if (best) {
        nextOutfit = {
          ...nextOutfit,
          calcado: { ...nextOutfit.calcado, colorId: closestLookColorId(best.hexes[0]), modelo: best.nome, tipo: best.tipo },
        }
      }
    }
    onOutfitChange(nextOutfit)
  }

  return (
    <div className="space-y-3">
      {visibleGarments.map((garment) => (
        <GarmentSection
          key={garment.key}
          garment={garment}
          piece={outfit[garment.key]}
          onChange={(next) => handleGarmentChange(garment.key, next)}
          sneakers={sneakers}
          suggestedSneaker={garment.key === 'calcado' ? suggestedSneaker : undefined}
        />
      ))}
    </div>
  )
}
