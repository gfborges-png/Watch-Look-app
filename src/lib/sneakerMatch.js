// SneakerScore — mesmo padrão de motor do relógio (recommendationEngine):
// média ponderada de sub-scores 0-100, cada um explicável, com peso
// redistribuído quando um dado não está disponível.
//   ocasião 28% · estilo/formalidade 22% · harmonia com as roupas 18% ·
//   preferência pessoal 13% · clima 9% · rotação 10%
//
// Harmonia de cor não é o fator dominante — um tênis casual que só
// combina na cor não deveria vencer um mais formal quando a ocasião pede
// formalidade (bug real: "reunião importante" sugerindo um Jordan
// puramente por combinar de cor com o resto do look).
//
// "Preferência pessoal" aqui reaproveita o mesmo grupo de paleta (quente/
// frio/terroso/neutro) que o relógio já usa. "Rotação" reaproveita o
// mesmo histórico do relógio (storage.logWornToday grava sneakerId
// junto, quando há um tênis na jogada) — sem histórico passado, o
// sub-score fica null e o peso é redistribuído, igual a qualquer outro.
import { LOOK_COLORS, colorDistance, netVibe } from './matchEngine.js'
import { closestLookColorId } from './colorDetect.js'
import { OCCASION_DIMENSIONS, occasionProfileWithVibe } from './occasionDimensions.js'
import { scorePersonalPreference } from './preferenceScore.js'
import { rotationScore, usageStats } from './rotationEngine.js'
import { combineWeightedScore } from './scoreCombine.js'

const WEIGHTS = { harmonia: 18, ocasiao: 28, estilo: 22, clima: 9, preferencia: 13, rotacao: 10 }

// Formalidade relativa de cada tipo de calçado (GARMENTS.calcado.tipos).
const TIPO_FORMALITY = { 'Sapato social': 90, Loafer: 70, Bota: 45, Tênis: 25 }

// Quão bem cada tipo de calçado se dá com calor/frio — couro fechado
// pesa mais no calor, tênis respirável não segura tanto frio quanto bota.
const TIPO_CLIMA = {
  quente: { Tênis: 90, Loafer: 60, 'Sapato social': 40, Bota: 25 },
  frio: { Bota: 90, 'Sapato social': 65, Loafer: 60, Tênis: 45 },
}

function sneakerColorGroup(sneaker) {
  const colorId = closestLookColorId(sneaker.hexes[0])
  return LOOK_COLORS.find((c) => c.id === colorId)?.groups[0] ?? 'neutro'
}

function harmoniaSubScore(sneaker, coloredGarments) {
  if (!coloredGarments || coloredGarments.length === 0) return { value: null, reasons: [] }
  const sneakerColorId = closestLookColorId(sneaker.hexes[0])
  const sneakerGroups = LOOK_COLORS.find((c) => c.id === sneakerColorId)?.groups ?? []
  const reasons = []
  let weightedSum = 0
  let weightTotal = 0
  for (const g of coloredGarments) {
    let piece = sneakerGroups.some((gr) => g.color.groups.includes(gr)) ? 72 : 45
    const closest = Math.min(...sneaker.hexes.map((h) => colorDistance(h, g.color.hex)))
    if (closest < 70) piece = Math.max(piece, 92)
    else if (closest < 130) piece = Math.max(piece, 78)
    if (piece >= 92) reasons.push(`cria eco cromático com ${g.pronoun} ${g.modelo || g.label.toLowerCase()}`)
    weightedSum += piece * g.weight
    weightTotal += g.weight
  }
  return { value: Math.round(weightedSum / weightTotal), reasons }
}

// Quão bem o TIPO do calçado serve a ocasião nomeada (sapato social pra
// reunião importante, tênis de verdade liberado no treino) — a mesma
// tabela de formalidade-alvo por ocasião usada pelo relógio.
function ocasiaoSubScore(sneaker, contextId, vibeId) {
  const profile = vibeId ? occasionProfileWithVibe(contextId, vibeId) : OCCASION_DIMENSIONS[contextId]
  if (!profile) return { value: null, reasons: [] }
  const tipoFormality = TIPO_FORMALITY[sneaker.tipo] ?? 25
  const diff = Math.abs(tipoFormality - profile.formality)
  const value = Math.round(Math.max(0, 100 - diff))
  const reasons = []
  if (value >= 80) reasons.push('tipo de calçado adequado pra essa ocasião')
  return { value, reasons }
}

// Diferente de "ocasião": aqui é a coerência com a formalidade das
// OUTRAS peças do look em si (via netVibe), útil mesmo sem uma ocasião
// nomeada — mesmo raciocínio do formalitySubScore do relógio.
function estiloSubScore(sneaker, garments) {
  if (!garments || garments.length === 0) return { value: null, reasons: [] }
  const vibe = netVibe(garments)
  const target = vibe === 0 ? 55 : vibe > 0 ? Math.min(90, 55 + vibe * 12) : Math.max(15, 55 + vibe * 12)
  const tipoFormality = TIPO_FORMALITY[sneaker.tipo] ?? 25
  const diff = Math.abs(tipoFormality - target)
  const value = Math.round(Math.max(0, 100 - diff * 1.1))
  return { value, reasons: [] }
}

function climaSubScore(sneaker, weatherBias) {
  if (!weatherBias || weatherBias === 'ameno') return { value: null, reasons: [] }
  const value = TIPO_CLIMA[weatherBias]?.[sneaker.tipo] ?? 50
  const reasons = []
  if (value >= 85) reasons.push(weatherBias === 'quente' ? 'calçado respirável combina com o calor de hoje' : 'calçado mais fechado combina com o frio de hoje')
  return { value, reasons }
}

function preferenciaSubScore(sneaker, personalBias) {
  return scorePersonalPreference(sneakerColorGroup(sneaker), personalBias)
}

// Mesmo raciocínio do rotationSubScore do relógio: favorece o tênis
// parado há mais tempo, pra "Hoje" não sugerir sempre o mesmo campeão
// de score quando o contexto/vibe não muda de um dia pro outro.
function rotacaoSubScore(sneaker, history) {
  if (!history || history.length === 0) return { value: null, reasons: [] }
  const value = rotationScore(sneaker.id, history, 'sneakerId')
  const reasons = []
  const { daysSinceWorn } = usageStats(sneaker.id, history, 'sneakerId')
  if (daysSinceWorn !== Infinity && daysSinceWorn <= 2) reasons.push('você já usou esse tênis nos últimos dias — que tal variar?')
  return { value, reasons }
}

// Pontua todo o catálogo de tênis contra o look — mesmo formato de
// retorno do motor de relógio (match/band-ready/subScores/reasons),
// pronto pra uma futura UI explicável (Fase D) além do "trocar" atual.
// `garments`: todas as peças ativas (formalidade geral do look);
// `coloredGarments`: só as com cor resolvida (harmonia cromática).
export function scoreSneakersForLook(sneakers, opts = {}) {
  const { coloredGarments = [], garments = coloredGarments, contextId = null, weatherBias = null, personalBias = {}, vibeId = null, history = [] } = opts
  return sneakers
    .map((sneaker) => {
      const harmonia = harmoniaSubScore(sneaker, coloredGarments)
      const ocasiao = ocasiaoSubScore(sneaker, contextId, vibeId)
      const estilo = estiloSubScore(sneaker, garments)
      const clima = climaSubScore(sneaker, weatherBias)
      const preferencia = preferenciaSubScore(sneaker, personalBias)
      const rotacao = rotacaoSubScore(sneaker, history)

      const subScores = { harmonia: harmonia.value, ocasiao: ocasiao.value, estilo: estilo.value, clima: clima.value, preferencia: preferencia.value, rotacao: rotacao.value }
      const match = combineWeightedScore(subScores, WEIGHTS)
      const reasons = [...new Set([...harmonia.reasons, ...ocasiao.reasons, ...estilo.reasons, ...clima.reasons, ...preferencia.reasons, ...rotacao.reasons])]

      return { sneaker, match, subScores, reasons }
    })
    .sort((a, b) => b.match - a.match)
}

// `otherColoredGarments`: peças já com cor resolvida (ver
// matchEngine.coloredActiveGarments), SEM o próprio calçado. `contextId`
// é opcional — sem ele, cor e estilo ainda decidem. `opts.weatherBias`
// e `opts.personalBias` são opcionais, mesmos sinais do motor de relógio.
export function pickBestSneakerForGarments(sneakers, otherColoredGarments, contextId = null, opts = {}) {
  if (!sneakers || sneakers.length === 0) return null
  const ranked = scoreSneakersForLook(sneakers, { coloredGarments: otherColoredGarments, contextId, ...opts })
  return ranked[0]?.sneaker ?? null
}
