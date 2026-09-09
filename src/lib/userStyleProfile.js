// UserStyleProfile — a "preferência pessoal" tratada como entidade, não
// como regra fixa no código. Tudo aqui é DERIVADO de dados reais
// (escolhas, feedback, favoritos); não existe nenhuma frase tipo "o
// usuário prefere X" hardcoded em lugar nenhum do motor de recomendação.
// Isso é o que permite, no futuro, esse mesmo cálculo rodar igual pra
// qualquer usuário de uma versão pública — a lógica não sabe quem é
// "você", só sabe ler o histórico que existir.
import { getWatchDimensions, inferWatchTypes } from './watchModel.js'

const FEEDBACK_WEIGHT = { love: 2, like: 1, dislike: -1.5 }
const DISLIKE_REASON_LABELS = {
  cor: 'Cor',
  'formal-demais': 'Formal demais',
  'casual-demais': 'Casual demais',
  'relogio-errado': 'Relógio errado',
  'tenis-errado': 'Tênis errado',
  'perfume-errado': 'Perfume errado',
  outro: 'Outro',
}

function findWatch(collection, watchId) {
  return collection.find((w) => w.id === watchId) ?? null
}

// Combina choices (voto = 1) + feedback (voto ponderado pela reação) em
// uma lista única de {watch, weight}, ignorando entradas cujo relógio já
// não existe mais na coleção (removido/editado).
function weightedEntries(collection, choices, feedback) {
  const entries = []
  for (const c of choices) {
    const watch = findWatch(collection, c.watchId)
    if (watch) entries.push({ watch, weight: 1 })
  }
  for (const f of feedback) {
    const watch = findWatch(collection, f.watchId)
    const weight = FEEDBACK_WEIGHT[f.rating] ?? 0
    if (watch && weight !== 0) entries.push({ watch, weight })
  }
  return entries
}

function weightedAverage(entries, pick) {
  let sum = 0
  let totalWeight = 0
  for (const { watch, weight } of entries) {
    sum += pick(watch) * weight
    totalWeight += Math.abs(weight)
  }
  return totalWeight > 0 ? sum / totalWeight : null
}

// Deriva a entidade completa a partir do estado atual — nunca persistida
// como "verdade" própria (ficaria desatualizada); recalculada sempre que
// exibida, a partir de choices/feedback/favoritos/coleção, que são a
// fonte real dos dados.
export function computeUserStyleProfile({ collection = [], choices = [], feedback = [], favorites = [] } = {}) {
  const entries = weightedEntries(collection, choices, feedback)

  const formalityPreference = entries.length > 0 ? Math.round(weightedAverage(entries, (w) => getWatchDimensions(w).formality)) : null

  const colorPreferences = {}
  for (const { watch, weight } of entries) {
    const group = watch.cor?.startsWith('neutro') ? 'neutro' : watch.cor
    if (!group) continue
    colorPreferences[group] = (colorPreferences[group] ?? 0) + weight
  }

  const favoriteWatches = collection.filter((w) => favorites.includes(w.id))
  const favoriteCategories = {}
  for (const watch of favoriteWatches) {
    for (const type of inferWatchTypes(watch)) {
      favoriteCategories[type] = (favoriteCategories[type] ?? 0) + 1
    }
  }

  const dislikedPatterns = {}
  for (const f of feedback) {
    if (f.rating !== 'dislike' || !f.reason) continue
    dislikedPatterns[f.reason] = (dislikedPatterns[f.reason] ?? 0) + 1
  }

  const contextPreferences = {}
  for (const entry of [...choices, ...feedback]) {
    if (!entry.context) continue
    contextPreferences[entry.context] = (contextPreferences[entry.context] ?? 0) + 1
  }

  const feedbackSummary = feedback.reduce(
    (acc, f) => {
      acc.total += 1
      acc[f.rating] = (acc[f.rating] ?? 0) + 1
      return acc
    },
    { total: 0, love: 0, like: 0, dislike: 0 },
  )

  return {
    stylePreferences: { dominantTypes: topEntries(favoriteCategories, 3) },
    colorPreferences,
    formalityPreference,
    favoriteCategories: topEntries(favoriteCategories, 5).map(([id]) => id),
    dislikedPatterns: topEntries(dislikedPatterns, 5).map(([id, count]) => ({ id, label: DISLIKE_REASON_LABELS[id] ?? id, count })),
    contextPreferences,
    feedbackSummary,
    sampleSize: entries.length,
  }
}

function topEntries(counts, n) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
}

// Transforma o perfil calculado em frases prontas pra exibir — linguagem
// neutra ("Seu estilo tende a..."), sem nunca referenciar um usuário
// específico, pra funcionar igual numa futura versão com muitos usuários.
export function describeStyleProfile(profile) {
  const insights = []

  if (profile.sampleSize < 4) {
    return ['Ainda não há dados suficientes — use o app por mais alguns dias e registre suas escolhas e feedback.']
  }

  if (profile.formalityPreference != null) {
    if (profile.formalityPreference >= 70) insights.push('Seu estilo tende a ser mais formal e discreto.')
    else if (profile.formalityPreference <= 35) insights.push('Seu estilo tende a ser mais esportivo e despojado.')
    else insights.push('Seu estilo equilibra formal e casual, sem pender muito pra nenhum dos dois.')
  }

  const topColor = topEntries(profile.colorPreferences, 1)[0]
  if (topColor) {
    const label = { quente: 'quentes', frio: 'frias', terroso: 'terrosas', neutro: 'neutras' }[topColor[0]] ?? topColor[0]
    insights.push(`Você costuma preferir paletas ${label}.`)
  }

  if (profile.dislikedPatterns.length > 0) {
    insights.push(`O motivo mais comum de rejeição nas suas sugestões: ${profile.dislikedPatterns[0].label.toLowerCase()}.`)
  }

  if (profile.feedbackSummary.total > 0) {
    const positivePct = Math.round(((profile.feedbackSummary.love + profile.feedbackSummary.like) / profile.feedbackSummary.total) * 100)
    insights.push(`${positivePct}% das sugestões avaliadas foram bem recebidas.`)
  }

  return insights
}
