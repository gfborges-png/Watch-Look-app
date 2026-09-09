// Escolhe, entre os tênis cadastrados, o que melhor combina com as
// outras peças já coloridas do look — mesma lógica de compatibilidade
// cromática do motor de recomendação de relógios (grupo de paleta +
// distância de cor), aplicada ao catálogo de tênis do usuário em vez
// da coleção de relógios. Quando a ocasião é informada, também pesa se
// o TIPO do tênis é apropriado (sapato social pra um casamento, tênis
// de verdade pro treino) — cor sozinha não avisa que um chinelo casual
// não serve pra reunião importante.
import { LOOK_COLORS, colorDistance } from './matchEngine.js'
import { closestLookColorId } from './colorDetect.js'

// Formalidade relativa de cada tipo de calçado (GARMENTS.calcado.tipos)
// — usado só pra comparar com o quão formal a ocasião pede, não é uma
// dimensão exposta em outro lugar do app.
const TIPO_FORMALITY = { 'Sapato social': 90, Loafer: 70, Bota: 45, Tênis: 25 }

// Mesmo perfil de formalidade-alvo por ocasião do motor de relógios
// (ver recommendationEngine.OCCASION_PROFILES), só que aqui simplificado
// pra uma única dimensão — o suficiente pra saber se o momento pede algo
// mais social ou se um tênis de verdade está liberado.
const OCCASION_FORMALITY = {
  trabalho: 55,
  reuniaoImportante: 85,
  casual: 25,
  treino: 5,
  fimDeSemana: 25,
  jantarRomantico: 65,
  festa: 40,
  casamento: 85,
}

function scoreSneakerAgainstGarments(sneaker, otherColoredGarments, contextId) {
  let piece
  if (otherColoredGarments.length === 0) {
    piece = 50
  } else {
    const sneakerColorId = closestLookColorId(sneaker.hexes[0])
    const sneakerGroups = LOOK_COLORS.find((c) => c.id === sneakerColorId)?.groups ?? []
    let weightedSum = 0
    let weightTotal = 0
    for (const g of otherColoredGarments) {
      let p = sneakerGroups.some((gr) => g.color.groups.includes(gr)) ? 72 : 45
      const closest = Math.min(...sneaker.hexes.map((h) => colorDistance(h, g.color.hex)))
      if (closest < 70) p = Math.max(p, 92)
      else if (closest < 130) p = Math.max(p, 78)
      weightedSum += p * g.weight
      weightTotal += g.weight
    }
    piece = weightedSum / weightTotal
  }

  const occasionTarget = OCCASION_FORMALITY[contextId]
  if (occasionTarget != null) {
    const tipoFormality = TIPO_FORMALITY[sneaker.tipo] ?? 25
    const diff = Math.abs(tipoFormality - occasionTarget)
    const tipoScore = Math.max(0, 100 - diff)
    piece = piece * 0.65 + tipoScore * 0.35
  }

  return Math.round(piece)
}

// `otherColoredGarments`: peças já com cor resolvida (ver
// matchEngine.coloredActiveGarments), SEM o próprio calçado. `contextId`
// é opcional — sem ele, só a cor decide.
export function pickBestSneakerForGarments(sneakers, otherColoredGarments, contextId = null) {
  if (!sneakers || sneakers.length === 0) return null
  let best = null
  let bestScore = -1
  for (const sneaker of sneakers) {
    const score = scoreSneakerAgainstGarments(sneaker, otherColoredGarments, contextId)
    if (score > bestScore) {
      bestScore = score
      best = sneaker
    }
  }
  return best
}
