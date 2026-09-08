// Motor inverso: dado o look que a pessoa está usando (cores das peças +
// contexto), sugere quais relógios da coleção combinam melhor — aplicando
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

// Recebe até 3 ids de LOOK_COLORS e um contexto; devolve os relógios da
// coleção ordenados por compatibilidade, cada um com os motivos do match.
export function matchWatchesToLook(watches, colorIds, contextId) {
  const colors = colorIds.map((id) => LOOK_COLORS.find((c) => c.id === id)).filter(Boolean)

  const scored = watches.map((watch) => {
    const group = paletteGroup(watch.cor)
    let score = 0
    const reasons = []
    let paletteHit = false
    let ecoHit = false

    for (const color of colors) {
      if (color.groups.includes(group)) {
        score += 2
        paletteHit = true
      }
      const closest = Math.min(...watch.hexes.map((h) => colorDistance(h, color.hex)))
      if (closest < 70) {
        score += 4
        ecoHit = true
      } else if (closest < 130) {
        score += 1.5
      }
    }

    if (paletteHit) reasons.push(`combina com a paleta ${GROUP_LABEL[group]} do mostrador`)
    if (ecoHit) reasons.push('eco cromático: a cor do look repete a do mostrador')

    if (contextId === 'trabalho') {
      if (isWorkStyle(watch.estilo)) {
        score += 2
        reasons.push('estilo contido, cai bem no trabalho')
      } else if (isBoldStyle(watch.estilo)) {
        score -= 2
      }
    } else if (contextId === 'fimDeSemana' && isBoldStyle(watch.estilo)) {
      score += 2
      reasons.push('estilo statement, ótimo pra sair do óbvio no fim de semana')
    } else if (contextId === 'casual' && isBoldStyle(watch.estilo)) {
      score += 1
    }

    if (group === 'neutro' && colors.length === 0) {
      score += 1
      reasons.push('mostrador neutro combina com qualquer look')
    }

    return { watch, score, reasons }
  })

  scored.sort((a, b) => b.score - a.score)
  return scored
}
