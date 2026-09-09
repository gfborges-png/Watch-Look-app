// Rotação da coleção: com que frequência cada relógio tem sido usado, e
// há quanto tempo. Alimenta o sub-score "Rotação" do motor de
// recomendação (favorece relógios parados há mais tempo, dado que o
// resto do look também combine) e a seção "Esquecidos na caixa".
import { daysSince, lastWornDate } from './storage.js'

export const FORGOTTEN_THRESHOLD_DAYS = 45

export function usesWithin(watchId, history, days) {
  return history.filter((h) => h.watchId === watchId && daysSince(h.date) <= days).length
}

export function usageStats(watchId, history) {
  const last = lastWornDate(watchId, history)
  return {
    lastWornDate: last,
    daysSinceWorn: daysSince(last),
    uses7: usesWithin(watchId, history, 7),
    uses30: usesWithin(watchId, history, 30),
    uses90: usesWithin(watchId, history, 90),
  }
}

// 0-100 — quanto esse relógio está "pedindo" pra ser usado. Parado há
// mais tempo e pouco frequente puntua alto (bom candidato pra hoje);
// usado muito recentemente ou com frequência alta nos últimos dias
// puntua baixo, mesmo que o resto do look combine bem.
export function rotationScore(watchId, history) {
  const { daysSinceWorn, uses7, uses30 } = usageStats(watchId, history)
  let score
  if (daysSinceWorn === Infinity) score = 85 // nunca registrado — vale experimentar, mas não é garantia de combinar
  else if (daysSinceWorn >= 60) score = 95
  else if (daysSinceWorn >= 30) score = 85
  else if (daysSinceWorn >= 14) score = 70
  else if (daysSinceWorn >= 7) score = 55
  else if (daysSinceWorn >= 3) score = 35
  else score = 15

  if (uses7 >= 3) score -= 15
  if (uses30 >= 8) score -= 10
  return Math.max(0, Math.min(100, score))
}

// Nível de uso do próprio relógio nos últimos 90 dias — "baixa" significa
// pouco usado (candidato a "esquecido na caixa"), não "pouco recomendado".
export function rotationLevel(watchId, history) {
  const { uses90 } = usageStats(watchId, history)
  if (uses90 <= 2) return 'baixa'
  if (uses90 <= 8) return 'média'
  return 'alta'
}

export function isForgotten(watchId, history) {
  const { daysSinceWorn } = usageStats(watchId, history)
  return daysSinceWorn === Infinity || daysSinceWorn >= FORGOTTEN_THRESHOLD_DAYS
}

// Coleção inteira ordenada do mais "esquecido" pro mais usado recentemente
// — base da seção "Esquecidos na caixa" e do critério de ordenação
// "há mais tempo sem uso".
export function sortByForgotten(watches, history) {
  return [...watches].sort((a, b) => {
    const da = usageStats(a.id, history).daysSinceWorn
    const db_ = usageStats(b.id, history).daysSinceWorn
    if (da === db_) return 0
    if (da === Infinity) return -1
    if (db_ === Infinity) return 1
    return db_ - da
  })
}
