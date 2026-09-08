// Motor inverso: dado o look que a pessoa está usando (peça por peça) +
// contexto, sugere quais relógios da coleção combinam melhor — aplicando
// as mesmas regras de src/lib/outfitEngine.js, só que de trás pra frente.
import { paletteGroup } from './outfitEngine.js'

export const LOOK_COLORS = [
  { id: 'bege', label: 'Bege', hex: '#D9C7A3', groups: ['quente', 'terroso', 'neutro'] },
  { id: 'cream', label: 'Cream', hex: '#F0E6D2', groups: ['quente'] },
  { id: 'marrom', label: 'Marrom', hex: '#6B4423', groups: ['quente', 'terroso'] },
  { id: 'terracota', label: 'Terracota', hex: '#C1622D', groups: ['quente'] },
  { id: 'oliva', label: 'Oliva', hex: '#6B6B47', groups: ['quente', 'terroso'] },
  { id: 'caqui', label: 'Cáqui', hex: '#B9AE8D', groups: ['terroso'] },
  { id: 'branco', label: 'Branco', hex: '#F5F3EE', groups: ['frio', 'neutro'] },
  { id: 'cinza', label: 'Cinza', hex: '#8C8C8C', groups: ['frio', 'neutro'] },
  { id: 'marinho', label: 'Marinho', hex: '#1B2A4A', groups: ['frio'] },
  { id: 'preto', label: 'Preto', hex: '#1B1B1D', groups: ['neutro'] },
  { id: 'turquesa', label: 'Turquesa', hex: '#12A9A6', groups: ['frio'] },
  { id: 'verde-agua', label: 'Verde água', hex: '#6FC7B8', groups: ['frio'] },
  { id: 'verde-escuro', label: 'Verde escuro', hex: '#1F3D2B', groups: ['terroso'] },
  { id: 'dourado', label: 'Dourado', hex: '#C9A227', groups: ['quente'] },
  { id: 'salmon', label: 'Salmon', hex: '#E0A98C', groups: ['quente'] },
  { id: 'amarelo', label: 'Amarelo', hex: '#F2C11A', groups: ['quente'] },
  { id: 'laranja', label: 'Laranja', hex: '#E8722C', groups: ['quente'] },
  { id: 'vermelho', label: 'Vermelho', hex: '#C23B3B', groups: ['quente'] },
]

export const CONTEXTS = [
  { id: 'trabalho', label: 'Trabalho' },
  { id: 'casual', label: 'Casual' },
  { id: 'fimDeSemana', label: 'Fim de semana' },
]

// Uma peça por chave. `weight` pondera o quanto a cor dessa peça pesa no
// match (a camisa fica perto do pulso e do rosto, pesa mais que o tênis).
// `tipos` alimenta a leitura de formalidade do look (alfaiataria x jeans).
// `pronoun` é só pra concordância nominal nos textos de motivo (o tênis
// -> "seu", a calça/camisa/jaqueta -> "sua"). `hasModel` libera um campo
// de texto livre pro modelo exato da peça (ex.: "Dunk Low Travis Scott").
export const GARMENTS = [
  { key: 'calcado', label: 'Tênis/Calçado', pronoun: 'seu', weight: 1, optional: false, hasModel: true, modelPlaceholder: 'Ex: Dunk Low Travis Scott Golf', tipos: ['Tênis', 'Sapato social', 'Bota', 'Loafer'] },
  { key: 'calca', label: 'Calça', pronoun: 'sua', weight: 1.5, optional: false, tipos: ['Jeans', 'Sarja/Chino', 'Alfaiataria', 'Cargo'] },
  { key: 'camisa', label: 'Camisa/Camiseta', pronoun: 'sua', weight: 2.5, optional: false, tipos: ['Camisa social', 'Camiseta', 'Polo', 'Linho'] },
  { key: 'jaqueta', label: 'Jaqueta/Overshirt', pronoun: 'sua', weight: 2, optional: true, tipos: ['Blazer', 'Jaqueta jeans', 'Bomber', 'Overshirt', 'Suede/couro'] },
]

export const DEFAULT_OUTFIT = {
  calcado: { colorId: null, tipo: null, modelo: '' },
  calca: { colorId: null, tipo: null },
  camisa: { colorId: null, tipo: null },
  jaqueta: { enabled: false, colorId: null, tipo: null },
}

const FORMAL_TIPOS = new Set(['Sapato social', 'Loafer', 'Alfaiataria', 'Camisa social', 'Blazer'])
const CASUAL_TIPOS = new Set(['Tênis', 'Bota', 'Jeans', 'Cargo', 'Camiseta', 'Jaqueta jeans', 'Bomber', 'Overshirt'])

const GROUP_LABEL = { quente: 'quente', frio: 'fria', terroso: 'terrosa', neutro: 'neutra' }

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function colorDistance(hexA, hexB) {
  const [r1, g1, b1] = hexToRgb(hexA)
  const [r2, g2, b2] = hexToRgb(hexB)
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2)
}

function isBoldStyle(estilo) {
  const s = estilo.toLowerCase()
  return s.includes('bold') || s.includes('statement') || s.includes('racing') || s.includes('vibrante')
}

function isWorkStyle(estilo) {
  const s = estilo.toLowerCase()
  return s.includes('dress') || s.includes('elegante') || s.includes('smart') || s.includes('técnico') || s.includes('luxo')
}

// Peças do outfit que têm cor escolhida (jaqueta só entra se ligada).
function activeGarments(outfit) {
  return GARMENTS.map((g) => {
    const piece = outfit[g.key]
    if (!piece) return null
    if (g.optional && !piece.enabled) return null
    return { ...g, colorId: piece.colorId, tipo: piece.tipo, modelo: piece.modelo?.trim() || null }
  }).filter(Boolean)
}

function netVibe(garments) {
  let vibe = 0
  for (const g of garments) {
    if (!g.tipo) continue
    if (FORMAL_TIPOS.has(g.tipo)) vibe += 1
    else if (CASUAL_TIPOS.has(g.tipo)) vibe -= 1
  }
  return vibe
}

// Recebe o outfit (peça por peça) e o contexto; devolve os relógios da
// coleção ordenados por compatibilidade, cada um com os motivos do match.
export function matchWatchesToLook(watches, outfit, contextId) {
  const garments = activeGarments(outfit)
  const coloredGarments = garments.filter((g) => g.colorId).map((g) => ({ ...g, color: LOOK_COLORS.find((c) => c.id === g.colorId) })).filter((g) => g.color)
  const vibe = netVibe(garments)

  const scored = watches.map((watch) => {
    const group = paletteGroup(watch.cor)
    let score = 0
    const reasonEntries = []

    for (const g of coloredGarments) {
      const w = g.weight / 2
      const nome = g.modelo || g.label.toLowerCase()
      if (g.color.groups.includes(group)) {
        score += 2 * w
        reasonEntries.push({ rank: 1, text: `${g.pronoun} ${nome} combina com a paleta ${GROUP_LABEL[group]} do mostrador` })
      }
      const closest = Math.min(...watch.hexes.map((h) => colorDistance(h, g.color.hex)))
      if (closest < 70) {
        score += 4 * w
        reasonEntries.push({ rank: 3, text: `${g.pronoun} ${nome} cria eco cromático com o mostrador` })
      } else if (closest < 130) {
        score += 1.5 * w
      }
    }

    if (group === 'neutro') score += 1

    if (vibe > 0) {
      if (isWorkStyle(watch.estilo)) {
        score += vibe
        reasonEntries.push({ rank: 2, text: 'look mais formal, e esse mostrador é discreto o bastante' })
      }
      if (isBoldStyle(watch.estilo)) score -= vibe
    } else if (vibe < 0) {
      const casualStrength = -vibe
      if (isBoldStyle(watch.estilo)) {
        score += casualStrength
        reasonEntries.push({ rank: 2, text: 'look mais despojado, combina com um mostrador statement' })
      }
    }

    if (contextId === 'trabalho') {
      if (isWorkStyle(watch.estilo)) score += 2
      else if (isBoldStyle(watch.estilo)) score -= 2
    } else if (contextId === 'fimDeSemana' && isBoldStyle(watch.estilo)) {
      score += 2
      reasonEntries.push({ rank: 2, text: 'estilo statement, ótimo pra sair do óbvio no fim de semana' })
    } else if (contextId === 'casual' && isBoldStyle(watch.estilo)) {
      score += 1
    }

    if (reasonEntries.length === 0 && group === 'neutro') {
      reasonEntries.push({ rank: 0, text: 'mostrador neutro combina com qualquer look' })
    }

    reasonEntries.sort((a, b) => b.rank - a.rank)
    const reasons = [...new Set(reasonEntries.map((r) => r.text))]

    return { watch, score, reasons }
  })

  scored.sort((a, b) => b.score - a.score)
  return scored
}
