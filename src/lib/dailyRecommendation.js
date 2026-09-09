// Monta o "Look do Dia" — a resposta direta pra "o que eu devo usar
// hoje?" sem exigir que o usuário informe nada primeiro.
//
// Como não há um look fotografado/informado nesse momento, o relógio é
// ranqueado só pelas dimensões que não dependem de peças de roupa
// (ocasião, clima, rotação, preferência pessoal — o motor já redistribui
// os pesos quando cor/estilo não estão disponíveis, então o score
// continua honesto). O look sugerido em si vem de outfitEngine.lookForOccasion,
// que já escolhe peças na paleta E no vocabulário certo pra ocasião
// (treino nunca vira camisa social só porque a cor combinaria) — por isso
// "cores harmonizam" entra como motivo garantido, mesmo sem um score
// numérico de cor pra essa combinação específica.
import { DEFAULT_OUTFIT, LOOK_COLORS } from './matchEngine.js'
import { recommendWatchesForLook } from './recommendationEngine.js'
import { lookForOccasion, paletteGroup } from './outfitEngine.js'
import { suggestPerfume } from './perfumeEngine.js'
import { closestLookColorId } from './colorDetect.js'
import { getWatchDimensions } from './watchModel.js'
import { rotationScore } from './rotationEngine.js'

export function defaultOccasionForToday(date = new Date()) {
  const day = date.getDay()
  return day === 0 || day === 6 ? 'fimDeSemana' : 'trabalho'
}

export function greetingForNow(date = new Date()) {
  const h = date.getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

// Primeiro tênis cadastrado cuja cor pertence à mesma paleta do relógio —
// reaproveitado também no bundle de resultado do Look → Relógio.
export function pickOwnedSneakerForGroup(sneakers, group) {
  if (!sneakers || sneakers.length === 0) return null
  return (
    sneakers.find((s) => {
      const id = closestLookColorId(s.hexes[0])
      const color = LOOK_COLORS.find((c) => c.id === id)
      return color?.groups.includes(group)
    }) ?? null
  )
}

// Gera até `count` candidatos pra hoje, do melhor pro "quero variar" —
// cada um já com relógio, look, tênis e perfume sugeridos, score e
// motivos prontos pra exibir.
export function buildTodayCandidates(watches, opts = {}) {
  const { contextId = 'casual', weatherBias = null, history = [], personalBias = {}, sneakers = [], perfumes = [], count = 6 } = opts
  if (!watches || watches.length === 0) return []

  const ranked = recommendWatchesForLook(watches, DEFAULT_OUTFIT, contextId, { weatherBias, history, personalBias })

  return ranked.slice(0, Math.max(count, 1)).map((result) => {
    const { watch } = result
    const group = paletteGroup(watch.cor)
    const look = lookForOccasion(watch, contextId)
    const sneaker = pickOwnedSneakerForGroup(sneakers, group)
    const perfume = suggestPerfume({ weatherBias, context: contextId, ownedPerfumes: perfumes })

    const reasons = [...new Set(['cores harmonizam com o mostrador', ...result.reasons])]

    return {
      watch,
      group,
      match: result.match,
      band: result.band,
      subScores: result.subScores,
      reasons,
      look,
      sneaker,
      perfume,
    }
  })
}

// Ações "ajustar" da tela Hoje — nunca recalcula tudo do zero, só
// escolhe outro índice dentro do POOL já ranqueado pra hoje (evita
// trocar pra um relógio mal avaliado só pra satisfazer o eixo pedido).
//   'outra' — próximo candidato da lista (ciclo simples)
//   'variar' — o mais "pedindo pra ser usado" do pool (rotação), não
//     necessariamente o mais parecido com o atual
//   'casual' / 'sofisticado' — desloca a formalidade do relógio
//   'ousado' — desloca o "statement level" do relógio
// Sem alternativa que satisfaça o eixo pedido, mantém o índice atual —
// nunca troca pra pior só por trocar.
export function pickAdjustedIndex(candidates, currentIndex, direction, opts = {}) {
  if (!candidates || candidates.length <= 1) return currentIndex
  const { history = [] } = opts

  if (direction === 'outra') return (currentIndex + 1) % candidates.length

  if (direction === 'variar') {
    let bestIdx = currentIndex
    let bestValue = -Infinity
    candidates.forEach((c, idx) => {
      if (idx === currentIndex) return
      const value = rotationScore(c.watch.id, history)
      if (value > bestValue || (value === bestValue && c.match > candidates[bestIdx].match)) {
        bestValue = value
        bestIdx = idx
      }
    })
    return bestIdx
  }

  const dimKey = direction === 'ousado' ? 'statementLevel' : 'formality'
  const wantHigher = direction === 'sofisticado' || direction === 'ousado'
  const currentDim = getWatchDimensions(candidates[currentIndex].watch)[dimKey]

  let bestIdx = currentIndex
  let bestMatch = -Infinity
  candidates.forEach((c, idx) => {
    if (idx === currentIndex) return
    const dim = getWatchDimensions(c.watch)[dimKey]
    const satisfies = wantHigher ? dim > currentDim : dim < currentDim
    if (!satisfies) return
    if (c.match > bestMatch) {
      bestMatch = c.match
      bestIdx = idx
    }
  })
  return bestIdx
}
