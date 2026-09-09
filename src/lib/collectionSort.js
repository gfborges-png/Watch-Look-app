// Ordenação da coleção — separado do componente pra poder testar as
// regras isoladamente e reutilizar de um futuro hook sem duplicar lógica.
import { DEFAULT_OUTFIT } from './matchEngine.js'
import { recommendWatchesForLook } from './recommendationEngine.js'
import { usageStats } from './rotationEngine.js'
import { defaultOccasionForToday } from './dailyRecommendation.js'

export const SORT_OPTIONS = [
  { id: 'nome', label: 'Nome' },
  { id: 'melhor-hoje', label: 'Melhor para hoje' },
  { id: 'mais-usados', label: 'Mais usados' },
  { id: 'menos-usados', label: 'Menos usados' },
  { id: 'recentes', label: 'Usados recentemente' },
  { id: 'sem-uso', label: 'Há mais tempo sem uso' },
]

function totalUses(watchId, history) {
  return history.filter((h) => h.watchId === watchId).length
}

// `opts` só é necessário pra 'melhor-hoje' (precisa do motor de
// recomendação); os demais critérios usam só `history`.
export function sortCollection(watches, sortId, { history = [], weatherBias = null, personalBias = {} } = {}) {
  if (sortId === 'nome') {
    return [...watches].sort((a, b) => a.nome.localeCompare(b.nome))
  }

  if (sortId === 'melhor-hoje') {
    const ranked = recommendWatchesForLook(watches, DEFAULT_OUTFIT, defaultOccasionForToday(), { weatherBias, history, personalBias })
    return ranked.map((r) => r.watch)
  }

  if (sortId === 'mais-usados' || sortId === 'menos-usados') {
    const withCounts = watches.map((w) => ({ w, n: totalUses(w.id, history) }))
    withCounts.sort((a, b) => (sortId === 'mais-usados' ? b.n - a.n : a.n - b.n))
    return withCounts.map((x) => x.w)
  }

  if (sortId === 'recentes' || sortId === 'sem-uso') {
    const withDays = watches.map((w) => ({ w, days: usageStats(w.id, history).daysSinceWorn }))
    withDays.sort((a, b) => (sortId === 'recentes' ? a.days - b.days : b.days - a.days))
    return withDays.map((x) => x.w)
  }

  return watches
}
