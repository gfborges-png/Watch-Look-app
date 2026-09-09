// Monta o "Look do Dia" — a resposta direta pra "o que eu devo usar
// hoje?" sem exigir que o usuário informe nada primeiro.
//
// Como não há um look fotografado/informado nesse momento, o relógio é
// ranqueado só pelas dimensões que não dependem de peças de roupa
// (ocasião, clima, rotação, preferência pessoal — o motor já redistribui
// os pesos quando cor/estilo não estão disponíveis, então o score
// continua honesto). O look sugerido em si vem de outfitEngine.generateLooks,
// que já escolhe peças na paleta do relógio por construção — por isso
// "cores harmonizam" entra como motivo garantido, mesmo sem um score
// numérico de cor pra essa combinação específica.
import { CONTEXTS, DEFAULT_OUTFIT, LOOK_COLORS } from './matchEngine.js'
import { recommendWatchesForLook } from './recommendationEngine.js'
import { generateLooks, paletteGroup } from './outfitEngine.js'
import { suggestPerfume } from './perfumeEngine.js'
import { closestLookColorId } from './colorDetect.js'

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

function findOwnedSneakerForGroup(sneakers, group) {
  if (!sneakers || sneakers.length === 0) return null
  return (
    sneakers.find((s) => {
      const id = closestLookColorId(s.hexes[0])
      const color = LOOK_COLORS.find((c) => c.id === id)
      return color?.groups.includes(group)
    }) ?? null
  )
}

function lookForContext(watch, contextId) {
  const looks = generateLooks(watch)
  const label = CONTEXTS.find((c) => c.id === contextId)?.label ?? ''
  return looks.find((l) => l.contexto.toLowerCase().startsWith(label.toLowerCase())) ?? looks[0]
}

// Gera até `count` candidatos pra hoje, do melhor pro "quero variar" —
// cada um já com relógio, look, tênis e perfume sugeridos, score e
// motivos prontos pra exibir.
export function buildTodayCandidates(watches, opts = {}) {
  const { contextId = 'casual', weatherBias = null, history = [], personalBias = {}, sneakers = [], perfumes = [], count = 3 } = opts
  if (!watches || watches.length === 0) return []

  const ranked = recommendWatchesForLook(watches, DEFAULT_OUTFIT, contextId, { weatherBias, history, personalBias })

  return ranked.slice(0, Math.max(count, 1)).map((result) => {
    const { watch } = result
    const group = paletteGroup(watch.cor)
    const look = lookForContext(watch, contextId)
    const sneaker = findOwnedSneakerForGroup(sneakers, group)
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
