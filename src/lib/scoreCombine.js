// Combina sub-scores 0-100 numa média ponderada 0-100, ignorando (e
// redistribuindo o peso de) qualquer sub-score ausente. Mesmo padrão
// usado pelos motores de relógio, tênis e perfume: dado faltando nunca
// bloqueia nem inventa um valor, só reduz a base do cálculo.
export function combineWeightedScore(subScores, weights, fallback = 50) {
  let weightedSum = 0
  let totalWeight = 0
  for (const key of Object.keys(weights)) {
    const v = subScores[key]
    if (v == null) continue
    weightedSum += v * weights[key]
    totalWeight += weights[key]
  }
  if (totalWeight === 0) return fallback
  return Math.round(weightedSum / totalWeight)
}
