// Motor de recomendação v2 — dado um look (peça por peça) + contexto,
// pontua cada relógio da coleção com um score ABSOLUTO de 0 a 100 (não
// mais relativo ao melhor resultado do momento: o primeiro colocado só
// chega em 100 se realmente for um match excelente em todas as frentes).
//
// O score é a média ponderada de 6 sub-scores, cada um também 0-100:
//   ocasião 29% · estilo/formalidade 23% · cor 18% · clima 10% ·
//   rotação 10% · preferência pessoal 10%
//
// Contexto e formalidade pesam mais que cor sozinha — cor combinando não
// basta se a ocasião pede outra coisa (ver conversa que motivou isso:
// tênis casual sugerido pra reunião importante só porque a cor batia).
//
// Qualquer sub-score cuja informação não esteja disponível (sem clima
// buscado, sem contexto definido, sem histórico de uso, etc.) é excluído
// e o peso é redistribuído entre os demais — assim a recomendação nunca
// bloqueia por falta de dado, só fica com uma base menor (e isso aparece
// nos motivos: "com mais dados eu explico melhor").
import { paletteGroup } from './outfitEngine.js'
import { GROUP_LABEL, colorDistance, netVibe, coloredActiveGarments, activeGarments } from './matchEngine.js'
import { getWatchDimensions } from './watchModel.js'
import { rotationScore, usageStats } from './rotationEngine.js'
import { OCCASION_DIMENSIONS as OCCASION_PROFILES, OCCASION_LABELS, occasionProfileWithVibe } from './occasionDimensions.js'
import { scorePersonalPreference } from './preferenceScore.js'
import { combineWeightedScore } from './scoreCombine.js'

const WEIGHTS = { cor: 18, ocasiao: 29, estilo: 23, clima: 10, rotacao: 10, preferencia: 10 }

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

// Score é o quão perto o relógio chega do perfil-alvo da ocasião (ver
// occasionDimensions.js, compartilhado com tênis e perfume), não uma
// lista de if/else por ocasião.
function occasionSubScore(watchDims, contextId, vibeId) {
  const profile = vibeId ? occasionProfileWithVibe(contextId, vibeId) : OCCASION_PROFILES[contextId]
  if (!profile) return { value: null, reasons: [] }

  const diff =
    Math.abs(watchDims.formality - profile.formality) * 0.5 +
    Math.abs(watchDims.statementLevel - profile.statement) * 0.3 +
    Math.abs(watchDims.sportiness - profile.sportiness) * 0.2
  const value = Math.round(Math.max(0, 100 - diff * 0.9))

  const reasons = []
  if (value >= 82) reasons.push(`adequado para ${OCCASION_LABELS[contextId] ?? contextId}`)
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

// Recebe o outfit (peça por peça), o contexto e sinais extras opcionais
// (`weatherBias` 'quente'|'frio'|'ameno'|null vindo do clima do dia;
// `history` bruto de uso pro cálculo de rotação; `personalBias` por grupo
// de paleta aprendido de escolhas + feedback — ver storage.js). Devolve
// os relógios ordenados por `match` (0-100 absoluto), cada um com `band`,
// `subScores` e `reasons` explicando o porquê.
export function recommendWatchesForLook(watches, outfit, contextId, opts = {}) {
  const { weatherBias = null, history = [], personalBias = {}, vibeId = null } = opts
  const garments = activeGarments(outfit)
  const coloredGarments = coloredActiveGarments(outfit)

  const results = watches.map((watch) => {
    const group = paletteGroup(watch.cor)
    const dims = getWatchDimensions(watch)

    const cor = colorSubScore(watch, coloredGarments)
    const ocasiao = occasionSubScore(dims, contextId, vibeId)
    const estilo = formalitySubScore(dims, garments)
    const clima = weatherSubScore(watch, weatherBias)
    const rotacao = rotationSubScore(watch.id, history)
    const preferencia = scorePersonalPreference(group, personalBias)

    const subScores = {
      cor: cor.value,
      ocasiao: ocasiao.value,
      estilo: estilo.value,
      clima: clima.value,
      rotacao: rotacao.value,
      preferencia: preferencia.value,
    }
    const match = combineWeightedScore(subScores, WEIGHTS)

    let reasons = [...cor.reasons, ...ocasiao.reasons, ...estilo.reasons, ...clima.reasons, ...rotacao.reasons, ...preferencia.reasons]
    if (reasons.length === 0 && group === 'neutro') reasons = ['mostrador neutro combina com qualquer look']
    reasons = [...new Set(reasons)]

    return { watch, match, band: scoreBand(match), subScores, reasons }
  })

  results.sort((a, b) => b.match - a.match)
  return results
}
