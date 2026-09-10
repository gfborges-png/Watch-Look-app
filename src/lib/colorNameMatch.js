// Traduz uma descrição livre de colorway ("Off-white/Marrom/Gum",
// "Solar Flare/Total Crimson"...) pra até 2 cores da paleta LOOK_COLORS —
// usado na importação em lote de tênis (nome + cor em texto, sem swatch
// escolhido manualmente). É uma aproximação por palavra-chave, sempre
// revisável depois no formulário de edição do tênis.
import { LOOK_COLORS } from './matchEngine.js'

// Frases de 2+ palavras primeiro (mais específicas que o fallback por
// palavra solta) — nomes de colorway que não têm uma palavra de cor
// "pura" isolada (jargão de sneaker/streetwear, PT e EN).
const PHRASES = [
  ['off white', 'bege'],
  ['off-white', 'bege'],
  ['solar flare', 'laranja'],
  ['total crimson', 'laranja'],
  ['jade smoke', 'verde-agua'],
  ['action green', 'verde-escuro'],
  ['military blue', 'marinho'],
  ['neutral olive', 'oliva'],
  ['oil green', 'oliva'],
  ['varsity red', 'vermelho'],
  ['slate grey', 'cinza'],
  ['slate gray', 'cinza'],
  ['rosa pastel', 'salmon'],
  ['cinza chumbo', 'cinza'],
  ['verde água', 'verde-agua'],
  ['verde agua', 'verde-agua'],
  ['azul marinho', 'marinho'],
  ['todo preto', 'preto'],
  ['todo caramelo', 'terracota'],
  ['branco total', 'branco'],
  ['cinza-chumbo', 'cinza'],
  ['cinza mescla', 'cinza'],
  ['azul-marinho', 'marinho'],
  ['azul escuro', 'marinho'],
  ['azul-escuro', 'marinho'],
]

const WORDS = {
  branco: 'branco',
  branca: 'branco',
  white: 'branco',
  sail: 'bege',
  oatmeal: 'bege',
  muslin: 'bege',
  flax: 'bege',
  cream: 'cream',
  preto: 'preto',
  preta: 'preto',
  black: 'preto',
  jet: 'preto',
  cinza: 'cinza',
  grey: 'cinza',
  gray: 'cinza',
  phantom: 'cinza',
  smoke: 'cinza',
  chumbo: 'cinza',
  marrom: 'marrom',
  brown: 'marrom',
  gum: 'marrom',
  caramelo: 'terracota',
  cognac: 'marrom',
  bege: 'bege',
  beige: 'bege',
  khaki: 'caqui',
  caqui: 'caqui',
  tan: 'bege',
  sand: 'bege',
  marinho: 'marinho',
  navy: 'marinho',
  azul: 'marinho',
  blue: 'marinho',
  turquesa: 'turquesa',
  teal: 'turquesa',
  jade: 'verde-agua',
  verde: 'oliva',
  green: 'oliva',
  olive: 'oliva',
  oliva: 'oliva',
  forest: 'verde-escuro',
  pine: 'verde-escuro',
  dourado: 'dourado',
  dourada: 'dourado',
  gold: 'dourado',
  rosa: 'salmon',
  pink: 'salmon',
  salmon: 'salmon',
  coral: 'salmon',
  flame: 'laranja',
  amarelo: 'amarelo',
  amarela: 'amarelo',
  yellow: 'amarelo',
  canary: 'amarelo',
  laranja: 'laranja',
  orange: 'laranja',
  terracota: 'terracota',
  vermelho: 'vermelho',
  vermelha: 'vermelho',
  red: 'vermelho',
  crimson: 'vermelho',
  grape: 'marinho',
  purple: 'marinho',
  roxo: 'marinho',
  roxa: 'marinho',
  mescla: 'cinza',
}

function hexFor(id) {
  return LOOK_COLORS.find((c) => c.id === id)?.hex
}

export function matchColorNameToHexes(text, max = 2) {
  const lower = (text ?? '').toLowerCase()
  const found = []
  const pushId = (id) => {
    if (id && !found.includes(id)) found.push(id)
  }

  // Remove do texto cada frase já batida antes de cair no fallback por
  // palavra solta — senão "off-white" (virou bege) deixa pra trás os
  // fragmentos "off" e "white", e "white" bate errado com branco.
  let remaining = lower
  for (const [phrase, id] of PHRASES) {
    if (found.length >= max) break
    if (remaining.includes(phrase)) {
      pushId(id)
      remaining = remaining.split(phrase).join(' ')
    }
  }

  if (found.length < max) {
    const tokens = remaining.split(/[^a-zà-ú]+/).filter(Boolean)
    for (const t of tokens) {
      if (found.length >= max) break
      if (WORDS[t]) pushId(WORDS[t])
    }
  }

  const hexes = found.slice(0, max).map(hexFor).filter(Boolean)
  return hexes.length > 0 ? hexes : [hexFor('cinza')]
}

// Marca conhecida a partir do nome — cobertura best-effort de marcas de
// sneaker/streetwear comuns; fica em branco (editável depois) quando não
// reconhece.
const BRAND_PREFIXES = [
  ['air jordan', 'Jordan'],
  ['jordan', 'Jordan'],
  ['nike', 'Nike'],
  ['adidas', 'Adidas'],
  ['yeezy', 'Yeezy'],
  ['new balance', 'New Balance'],
  ['on running', 'On'],
  ['on cloud', 'On'],
  ['vans', 'Vans'],
  ['reebok', 'Reebok'],
  ['gucci', 'Gucci'],
  ['puma', 'Puma'],
  ['converse', 'Converse'],
  ['asics', 'Asics'],
]

export function guessBrand(nome) {
  const lower = (nome ?? '').toLowerCase()
  for (const [prefix, brand] of BRAND_PREFIXES) {
    if (lower.includes(prefix)) return brand
  }
  return ''
}
