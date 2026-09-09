// Motor de recomendação v2 — dado um look (peça por peça) + contexto,
// pontua cada relógio da coleção com um score ABSOLUTO de 0 a 100 (não
// mais relativo ao melhor resultado do momento: o primeiro colocado só
// chega em 100 se realmente for um match excelente em todas as frentes).
//
// O score é a média ponderada de 6 sub-scores, cada um também 0-100:
//   cor 35% · ocasião 20% · estilo/formalidade 15% · clima 10% ·
//   rotação 10% · preferência pessoal 10%
//
// Qualquer sub-score cuja informação não esteja disponível (sem clima
// buscado, sem contexto definido, sem histórico de uso, etc.) é excluído
// e o peso é redistribuído entre os demais — assim a recomendação nunca
// bloqueia por falta de dado, só fica com uma base menor (e isso aparece
// nos motivos: "com mais dados eu explico melhor").
import { paletteGroup } from './outfitEngine.js'
import { GROUP_LABEL, colorDistance, isWorkStyle, isBoldStyle, netVibe, coloredActiveGarments, activeGarments } from './matchEngine.js'
import { getWatchDimensions } from './watchModel.js'
import { rotationScore, usageStats } from './rotationEngine.js'

const WEIGHTS = { cor: 35, ocasiao: 20, estilo: 15, clima: 10, rotacao: 10, preferencia: 10 }

export const SCORE_BANDS = [
  { id: 'excelente', label: 'Excelente', min: 90 },
  { id: 'muito-bom', label: 'Muito bom', min: 80 },
  { id: 'bom', label: 'Bom', min: 70 },
  { id: 'funciona', label: 'Funciona', min: 60 },
  { id: 'evitaria', label: 'Eu evitaria', min: 0 },
]

export function scoreBand(score) {
  return SCORE_BANDS.find((b) => score >= b.min) ?? SCORE_BANDS[SCORE_BANDS.length - 1]
}

function colorSubScore(watch, coloredGarments) {
  if (coloredGarments.length === 0) return { value: null, reasons: [] }
  const group = paletteGroup(watch.cor)
  const reasons = []
  let weightedSum = 0
  let weightTotal = 0

  for (const g of coloredGarments) {
    const nome = g.modelo || g.label.toLowerCase()
    let piece = group === 'neutro' ? 65 : 45
    if (g.color.groups.includes(group)) {
      piece = Math.max(piece, 72)
      reasons.push(`${g.pronoun} ${nome} combina com a paleta ${GROUP_LABEL[group]} do mostrador`)
    }
    const closest = Math.min(...watch.hexes.map((h) => colorDistance(h, g.color.hex)))
    if (closest < 70) {
      piece = Math.max(piece, 96)
      reasons.push(`${g.pronoun} ${nome} cria eco cromático com o mostrador`)
    } else if (closest < 130) {
      piece = Math.max(piece, 82)
    }
    weightedSum += piece * g.weight
    weightTotal += g.weight
  }

  return { value: Math.round(weightedSum / weightTotal), reasons }
}

function occasionSubScore(watch, contextId) {
  if (!contextId) return { value: null, reasons: [] }
  const work = isWorkStyle(watch.estilo)
  const bold = isBoldStyle(watch.estilo)
  const reasons = []
  let value

  if (contextId === 'trabalho') {
    value = work ? 92 : bold ? 35 : 65
    if (work) reasons.push('adequado para o trabalho — discreto o bastante pro escritório')
  } else if (contextId === 'fimDeSemana') {
    value = bold ? 92 : work ? 55 : 72
    if (bold) reasons.push('estilo statement, ótimo pra sair do óbvio no fim de semana')
  } else {
    value = bold ? 85 : work ? 62 : 75
  }
  return { value, reasons }
}

function formalitySubScore(watchDims, garments) {
  if (garments.length === 0) return { value: null, reasons: [] }
  const vibe = netVibe(garments)
  const target = vibe === 0 ? 55 : vibe > 0 ? Math.min(90, 55 + vibe * 12) : Math.max(15, 55 + vibe * 12)
  const diff = Math.abs(watchDims.formality - target)
  const value = Math.round(Math.max(0, 100 - diff * 1.1))
  const reasons = []
  if (value >= 80 && vibe > 0) reasons.push('combina com o grau de formalidade do look')
  else if (value >= 80 && vibe < 0) reasons.push('look mais despojado, e esse relógio acompanha bem')
  return { value, reasons }
}

function weatherSubScore(watch, weatherBias) {
  if (!weatherBias || weatherBias === 'ameno') return { value: null, reasons: [] }
  const group = paletteGroup(watch.cor)
  const reasons = []
  let value

  if (weatherBias === 'quente') {
    value = group === 'frio' || group === 'neutro' ? 90 : group === 'terroso' ? 55 : 38
    if (value >= 90) reasons.push('dia quente — mostrador claro combina com o clima de hoje')
  } else {
    value = group === 'quente' || group === 'terroso' ? 90 : group === 'neutro' ? 55 : 38
    if (value >= 90) reasons.push('dia frio — tom quente do mostrador combina com o clima de hoje')
  }
  return { value, reasons }
}

function rotationSubScore(watchId, history) {
  if (!history || history.length === 0) return { value: null, reasons: [] }
  const value = rotationScore(watchId, history)
  const reasons = []
  const { daysSinceWorn } = usageStats(watchId, history)
  if (daysSinceWorn === Infinity) reasons.push('você ainda não registrou ter usado esse relógio')
  else if (daysSinceWorn >= 30) reasons.push(`não é usado há ${daysSinceWorn} dias`)
  else if (daysSinceWorn <= 2) reasons.push('você já usou esse nos últimos dias — que tal variar?')
  return { value, reasons }
}

function preferenceSubScore(group, personalBias) {
  const bias = personalBias?.[group]
  if (bias == null || Object.keys(personalBias).length === 0) return { value: null, reasons: [] }
  const value = Math.round(Math.max(0, Math.min(100, 60 + bias * 13)))
  const reasons = []
  if (bias > 0.4) reasons.push('combina com o seu padrão de escolhas anteriores')
  else if (bias < -0.4) reasons.push('foge um pouco do que você costuma escolher')
  return { value, reasons }
}

function combineScore(subScores) {
  let weightedSum = 0
  let totalWeight = 0
  for (const key of Object.keys(WEIGHTS)) {
    const v = subScores[key]
    if (v == null) continue
    weightedSum += v * WEIGHTS[key]
    totalWeight += WEIGHTS[key]
  }
  if (totalWeight === 0) return 50
  return Math.round(weightedSum / totalWeight)
}

// Recebe o outfit (peça por peça), o contexto e sinais extras opcionais
// (`weatherBias` 'quente'|'frio'|'ameno'|null vindo do clima do dia;
// `history` bruto de uso pro cálculo de rotação; `personalBias` por grupo
// de paleta aprendido de escolhas + feedback — ver storage.js). Devolve
// os relógios ordenados por `match` (0-100 absoluto), cada um com `band`,
// `subScores` e `reasons` explicando o porquê.
export function recommendWatchesForLook(watches, outfit, contextId, opts = {}) {
  const { weatherBias = null, history = [], personalBias = {} } = opts
  const garments = activeGarments(outfit)
  const coloredGarments = coloredActiveGarments(outfit)

  const results = watches.map((watch) => {
    const group = paletteGroup(watch.cor)
    const dims = getWatchDimensions(watch)

    const cor = colorSubScore(watch, coloredGarments)
    const ocasiao = occasionSubScore(watch, contextId)
    const estilo = formalitySubScore(dims, garments)
    const clima = weatherSubScore(watch, weatherBias)
    const rotacao = rotationSubScore(watch.id, history)
    const preferencia = preferenceSubScore(group, personalBias)

    const subScores = {
      cor: cor.value,
      ocasiao: ocasiao.value,
      estilo: estilo.value,
      clima: clima.value,
      rotacao: rotacao.value,
      preferencia: preferencia.value,
    }
    const match = combineScore(subScores)

    let reasons = [...cor.reasons, ...ocasiao.reasons, ...estilo.reasons, ...clima.reasons, ...rotacao.reasons, ...preferencia.reasons]
    if (reasons.length === 0 && group === 'neutro') reasons = ['mostrador neutro combina com qualquer look']
    reasons = [...new Set(reasons)]

    return { watch, match, band: scoreBand(match), subScores, reasons }
  })

  results.sort((a, b) => b.match - a.match)
  return results
}
