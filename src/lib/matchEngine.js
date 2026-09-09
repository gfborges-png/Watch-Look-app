// Primitivos de domínio do look: paleta de cores, peças de roupa,
// contexto/ocasião e formalidade agregada do outfit. O cálculo de score
// em si mora em recommendationEngine.js, que importa daqui.
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
  { id: 'reuniaoImportante', label: 'Reunião importante' },
  { id: 'casual', label: 'Casual' },
  { id: 'treino', label: 'Treino' },
  { id: 'fimDeSemana', label: 'Fim de semana' },
  { id: 'jantarRomantico', label: 'Jantar romântico' },
  { id: 'festa', label: 'Festa' },
  { id: 'casamento', label: 'Casamento' },
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

// "quente" -> "quente do mostrador"/"fria" etc — concordância de gênero
// nos textos de motivo gerados por recommendationEngine.js.
export const GROUP_LABEL = { quente: 'quente', frio: 'fria', terroso: 'terrosa', neutro: 'neutra' }

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function colorDistance(hexA, hexB) {
  const [r1, g1, b1] = hexToRgb(hexA)
  const [r2, g2, b2] = hexToRgb(hexB)
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2)
}

export function isBoldStyle(estilo) {
  const s = estilo.toLowerCase()
  return s.includes('bold') || s.includes('statement') || s.includes('racing') || s.includes('vibrante')
}

export function isWorkStyle(estilo) {
  const s = estilo.toLowerCase()
  return s.includes('dress') || s.includes('elegante') || s.includes('smart') || s.includes('técnico') || s.includes('luxo')
}

// Peças do outfit que têm cor escolhida (jaqueta só entra se ligada).
export function activeGarments(outfit) {
  return GARMENTS.map((g) => {
    const piece = outfit[g.key]
    if (!piece) return null
    if (g.optional && !piece.enabled) return null
    return { ...g, colorId: piece.colorId, tipo: piece.tipo, modelo: piece.modelo?.trim() || null }
  }).filter(Boolean)
}

// Peças com cor resolvida pro swatch real (LOOK_COLORS) — usado tanto
// pelo cálculo de cor quanto pra decidir se há look suficiente pra avaliar.
export function coloredActiveGarments(outfit) {
  return activeGarments(outfit)
    .filter((g) => g.colorId)
    .map((g) => ({ ...g, color: LOOK_COLORS.find((c) => c.id === g.colorId) }))
    .filter((g) => g.color)
}

export function netVibe(garments) {
  let vibe = 0
  for (const g of garments) {
    if (!g.tipo) continue
    if (FORMAL_TIPOS.has(g.tipo)) vibe += 1
    else if (CASUAL_TIPOS.has(g.tipo)) vibe -= 1
  }
  return vibe
}

// O cálculo de score em si (absoluto, explicável, com sub-scores) mora em
// recommendationEngine.js — este arquivo fica só com os primitivos de
// domínio (cores, peças, formalidade do look) que aquele motor consome.
