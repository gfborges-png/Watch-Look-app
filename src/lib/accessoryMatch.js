// AccessoryScore — mesmo padrão dos outros motores (média ponderada de
// sub-scores 0-100, explicável, peso redistribuído quando um dado não
// está disponível): relação com o relógio 30% · formalidade 32% · cor
// 23% · material 15%.
//
// Acessório é sempre OPCIONAL: pickAccessoriesForLook só devolve algo
// acima de um piso de relevância (nunca "força" um resultado fraco só
// pra preencher a seção), e watchCompatibility='no' filtra o item por
// completo antes de pontuar — nunca aparece ao lado de um relógio,
// mesmo que o resto do look combine.
import { LOOK_COLORS, colorDistance } from './matchEngine.js'
import { closestLookColorId } from './colorDetect.js'
import { OCCASION_DIMENSIONS, occasionProfileWithVibe } from './occasionDimensions.js'
import { combineWeightedScore } from './scoreCombine.js'
import { inferAccessoryFormality, accessoryDisplayName } from './accessoryModel.js'
import { inferStatementLevel, inferBraceletMaterial } from './watchModel.js'

const WEIGHTS = { cor: 23, relogio: 30, formalidade: 32, material: 15 }

const DISCREET_STYLES = ['minimalista', 'classico']
const BOLD_STYLES = ['fashion', 'criativo', 'streetwear']

function accessoryColorGroups(accessory) {
  const colorId = closestLookColorId(accessory.primaryColor)
  return LOOK_COLORS.find((c) => c.id === colorId)?.groups ?? []
}

// Favorece continuidade (mesma família de cor), neutralidade (acessório
// neutro sempre "funciona") e contraste controlado (cores próximas o
// bastante pra não brigar); evita o pior caso — nenhuma pista de
// harmonia — caindo num piso neutro em vez de zerar.
function corSubScore(accessory, referenceHexes) {
  if (!referenceHexes || referenceHexes.length === 0) return { value: null, reasons: [] }
  const accGroups = accessoryColorGroups(accessory)
  const isNeutral = accGroups.includes('neutro')
  let best = isNeutral ? 65 : 45
  for (const hex of referenceHexes) {
    const refGroups = LOOK_COLORS.find((c) => c.id === closestLookColorId(hex))?.groups ?? []
    let piece = accGroups.some((g) => refGroups.includes(g)) ? 78 : isNeutral ? 65 : 48
    if (colorDistance(accessory.primaryColor, hex) < 70) piece = Math.max(piece, 92)
    best = Math.max(best, piece)
  }
  const reasons = []
  if (best >= 90) reasons.push('mantém continuidade de cor com o restante do look')
  else if (isNeutral && best < 90) reasons.push('cor neutra, funciona como uma base segura')
  return { value: best, reasons }
}

// Sinergia de material com o calçado do dia — não é sobre ocasião (isso
// é `formalidadeSubScore`), é sobre o material em si conversar ou não
// (couro com couro, por exemplo). Sem calçado conhecido, fica de fora
// do cálculo em vez de supor.
function materialSubScore(accessory, sneaker) {
  if (!sneaker?.tipo) return { value: null, reasons: [] }
  const sneakerIsLeather = ['Sapato social', 'Loafer', 'Bota'].includes(sneaker.tipo)
  if (accessory.material === 'couro' && sneakerIsLeather) {
    return { value: 88, reasons: ['o couro conversa com o calçado de hoje'] }
  }
  if (['tecido', 'cordao', 'resina'].includes(accessory.material) && sneaker.tipo === 'Tênis') {
    return { value: 72, reasons: [] }
  }
  return { value: 55, reasons: [] }
}

function formalidadeSubScore(accessory, contextId, vibeId) {
  const profile = vibeId ? occasionProfileWithVibe(contextId, vibeId) : OCCASION_DIMENSIONS[contextId]
  if (!profile) return { value: null, reasons: [] }
  const accessoryFormality = inferAccessoryFormality(accessory)
  const diff = Math.abs(accessoryFormality - profile.formality)
  const value = Math.round(Math.max(0, 100 - diff))
  const reasons = value < 45 ? ['estilo destoa um pouco da formalidade da ocasião'] : []
  return { value, reasons }
}

// A dimensão mais específica de acessório: nunca aparece se
// watchCompatibility='no' (filtrado antes de chegar aqui); ganha bônus
// se ='yes'; e, com relógio visualmente marcante (statement level
// alto), acessórios discretos (minimalista/clássico) sobem e os
// ousados (fashion/criativo/streetwear) descem — o relógio já é o
// protagonista, o acessório não deveria competir com ele.
function relogioSubScore(accessory, watch) {
  if (!watch) return { value: null, reasons: [] }

  let value = accessory.watchCompatibility === 'yes' ? 78 : accessory.watchCompatibility === 'neutral' ? 60 : 50
  const reasons = []
  const style = accessory.style ?? []
  const isDiscreet = style.some((s) => DISCREET_STYLES.includes(s))
  const isBold = style.some((s) => BOLD_STYLES.includes(s))
  const statement = inferStatementLevel(watch)

  if (statement >= 60) {
    if (isDiscreet) {
      value += 15
      reasons.push('mantido discreto porque o relógio já é o elemento mais marcante')
    } else if (isBold) {
      value -= 20
    }
  } else if (statement <= 35 && isBold) {
    value += 8
  }

  const braceletMaterial = inferBraceletMaterial(watch)
  if (['aco', 'prata', 'dourado'].includes(accessory.material) && ['aço', 'titânio'].includes(braceletMaterial)) {
    value += 10
    reasons.push('o metal conversa com a pulseira do relógio')
  } else if (accessory.material === 'couro' && braceletMaterial === 'couro') {
    value += 10
    reasons.push('o couro conversa com a pulseira do relógio')
  }

  if (accessory.watchCompatibility === 'yes' && reasons.length === 0) {
    reasons.push('combina bem ao lado do relógio')
  }

  return { value: Math.max(0, Math.min(100, value)), reasons }
}

// Pontua todo o catálogo de acessórios contra o look — mesmo formato de
// retorno dos outros motores (match/subScores/reasons). `referenceHexes`:
// hexes de LOOK_COLORS pra comparar cor (relógio + peças conhecidas,
// já resolvidas — ver dailyRecommendation.js e MatchResults.jsx pra como
// cada tela monta essa lista). `watch`/`sneaker` são objetos completos,
// não só cor — usados pra ler formalidade/material/statement level.
export function scoreAccessoriesForLook(accessories, opts = {}) {
  const { referenceHexes = [], contextId = null, watch = null, sneaker = null, vibeId = null } = opts
  return accessories
    .filter((a) => !(watch && a.watchCompatibility === 'no'))
    .map((accessory) => {
      const cor = corSubScore(accessory, referenceHexes)
      const material = materialSubScore(accessory, sneaker)
      const formalidade = formalidadeSubScore(accessory, contextId, vibeId)
      const relogio = relogioSubScore(accessory, watch)

      const subScores = { cor: cor.value, material: material.value, formalidade: formalidade.value, relogio: relogio.value }
      const match = combineWeightedScore(subScores, WEIGHTS)
      const reasons = [...new Set([...relogio.reasons, ...cor.reasons, ...formalidade.reasons, ...material.reasons])]

      return { accessory, match, subScores, reasons }
    })
    .sort((a, b) => b.match - a.match)
}

// Nunca força um acessório no resultado: só entra quem pontua acima de
// `minScore` (mesmo piso da faixa "Funciona" usada nos outros motores),
// e no máximo `max` — "enriquecer sem dominar", não uma lista completa
// do acervo.
export function pickAccessoriesForLook(accessories, opts = {}, { max = 2, minScore = 60 } = {}) {
  if (!accessories || accessories.length === 0) return []
  return scoreAccessoriesForLook(accessories, opts)
    .filter((r) => r.match >= minScore)
    .slice(0, max)
}

// Frase curta pro resultado do look — reaproveita o motivo mais forte já
// calculado (reasons[0]) em vez de gerar um texto novo; sem motivo
// específico, cai numa frase genérica mas ainda verdadeira.
export function accessoryJustification(pick) {
  const name = accessoryDisplayName(pick.accessory)
  if (pick.reasons[0]) return `${name} — ${pick.reasons[0]}.`
  return `${name} completa o look sem disputar atenção com o resto.`
}
