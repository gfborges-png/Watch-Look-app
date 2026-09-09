// Sugestão de perfume por ocasião (+ clima como ajuste fino). Recomenda
// família olfativa e intensidade de aplicação, com referências reais
// conhecidas de cada família como ponto de partida — não é "o perfume
// certo pra você", é "aqui está o tipo de coisa que combina, e alguns
// exemplos famosos pra você ter uma régua".
//
// Ocasião é o eixo principal (muda a família inteira — um jantar
// romântico e uma reunião de trabalho pedem coisas fundamentalmente
// diferentes, mesmo no mesmo dia); o clima só ajusta a concentração
// recomendada (EDT mais leve num dia quente, pode ir na versão mais
// forte num dia frio), não muda a família.
import { occasionDistance } from './occasionDimensions.js'
import { combineWeightedScore } from './scoreCombine.js'

const OCCASION_PROFILES = {
  trabalho: {
    familia: 'Aromático limpo',
    descritores: ['lavanda', 'vetiver', 'almíscar limpo'],
    porque: 'escritório pede o mais seguro e versátil — limpo, sem doçura que pese ao longo do dia',
    referencias: ['Chanel Bleu de Chanel EDT', 'Prada L’Homme'],
    intensidade: '2-3 borrifadas, EDT — discreto a 1 metro de distância',
    evitar: 'evita gourmand muito doce ou oud pesado no escritório',
  },
  reuniaoImportante: {
    familia: 'Amadeirado executivo',
    descritores: ['vetiver', 'cedro', 'âmbar seco'],
    porque: 'reunião de peso pede presença sem ostentação — amadeirado seco projeta confiança de perto, sem tomar a sala',
    referencias: ['Hermès Terre d’Hermès Parfum', 'Chanel Bleu de Chanel Parfum'],
    intensidade: '2-3 borrifadas, EDP — notável a 1 metro, não além',
    evitar: 'evita notas muito doces ou adocicadas — o objetivo é sobriedade',
  },
  casual: {
    familia: 'Aromático-amadeirado',
    descritores: ['lavanda', 'cedro', 'toque cítrico'],
    porque: 'dia a dia pede o mais versátil — vai bem em quase qualquer situação sem chamar atenção demais',
    referencias: ['Dior Homme', 'Chanel Bleu de Chanel EDP'],
    intensidade: '3-4 borrifadas, EDT ou EDP leve',
    evitar: null,
  },
  treino: {
    familia: 'Cítrico esportivo',
    descritores: ['bergamota', 'notas aquáticas', 'almíscar limpo'],
    porque: 'treino pede o mínimo possível — o objetivo é só ficar limpo, não competir com o esforço físico',
    referencias: ['Davidoff Cool Water', 'Issey Miyake L’Eau d’Issey pour Homme'],
    intensidade: '1-2 borrifadas, ou nenhuma — o banho pós-treino já resolve',
    evitar: 'evita qualquer coisa doce, amadeirada pesada ou muito concentrada',
  },
  fimDeSemana: {
    familia: 'Amadeirado-especiado leve',
    descritores: ['cardamomo', 'cedro', 'âmbar claro'],
    porque: 'fora do expediente dá pra ousar um degrau — mais corpo que o dia a dia, sem exagerar',
    referencias: ['Yves Saint Laurent Y EDP', 'Versace Eros'],
    intensidade: '4-5 borrifadas, EDP — pode projetar mais',
    evitar: null,
  },
  jantarRomantico: {
    familia: 'Amadeirado sensual',
    descritores: ['âmbar', 'especiarias doces', 'toque de oud'],
    porque: 'clima íntimo pede algo mais quente e sedutor, mas projetado pra quem está perto — não pro salão inteiro',
    referencias: ['Yves Saint Laurent La Nuit de L’Homme', 'Giorgio Armani Acqua di Giò Absolu'],
    intensidade: '3 borrifadas, EDP — presença a curta distância',
    evitar: 'evita fragrâncias muito frescas/aquáticas — o clima pede mais corpo',
  },
  festa: {
    familia: 'Amadeirado-doce statement',
    descritores: ['baunilha', 'tabaco', 'especiarias'],
    porque: 'fim de noite é a hora de sair do seguro do dia a dia — algo com mais personalidade e projeção',
    referencias: ['Tom Ford Tobacco Vanille', 'Versace Eros Parfum'],
    intensidade: '4-5 borrifadas, EDP ou Parfum — pode e deve projetar',
    evitar: null,
  },
  casamento: {
    familia: 'Amadeirado-especiado elegante',
    descritores: ['âmbar', 'baunilha seca', 'cedro', 'cardamomo'],
    porque: 'ocasião de peso e o dia inteiro de duração — pede algo com corpo que aguente sem precisar retocar',
    referencias: ['Tom Ford Tobacco Vanille', 'Yves Saint Laurent Y Parfum'],
    intensidade: '3-4 borrifadas, EDP — precisa aguentar o dia inteiro',
    evitar: null,
  },
}

const DEFAULT_OCCASION = 'casual'

// Famílias conhecidas pelo motor — usado pra popular o seletor no cadastro
// de perfumes, garantindo que o texto bate exatamente com o que as regras
// geram (senão "da sua coleção" nunca acha nada pra combinar).
export const KNOWN_FAMILIES = [...new Set(Object.values(OCCASION_PROFILES).map((c) => c.familia))]

// weatherBias: 'quente' | 'frio' | 'ameno' | null — só vira uma nota de
// ajuste na concentração, não muda a família. context: um dos ids de
// matchEngine.CONTEXTS. ownedPerfumes: catálogo cadastrado pelo usuário
// (src/lib/storage.js) — quando um deles bate com a família sugerida,
// entra em `owned` pra aparecer como sugestão primária, na frente das
// referências genéricas.
export function suggestPerfume({ weatherBias, context, ownedPerfumes = [] }) {
  const profile = OCCASION_PROFILES[context] ?? OCCASION_PROFILES[DEFAULT_OCCASION]

  let climaNota = null
  if (weatherBias === 'quente') climaNota = 'Dia quente — prefira a versão mais leve (EDT) dessa família.'
  else if (weatherBias === 'frio') climaNota = 'Dia frio — pode ir na versão mais concentrada (EDP/Parfum) sem medo.'

  const owned = ownedPerfumes.filter((p) => p.familia === profile.familia)
  return { ...profile, climaNota, owned }
}

// Cada família aqui tem exatamente uma ocasião "nativa" (a chave de
// OCCASION_PROFILES que a recomenda) — usado pra saber quão longe a
// família de um perfume cadastrado está da ocasião do dia, em vez de só
// filtrar por igualdade exata.
const FAMILY_NATIVE_OCCASION = Object.fromEntries(Object.entries(OCCASION_PROFILES).map(([occasionId, profile]) => [profile.familia, occasionId]))

// Combina os dois amadeirados-especiados; ainda com sensações de calor/
// frio bem diferentes na prática (um mais leve, um mais denso), então a
// nota de clima os trata separado apesar de "próximos" em ocasião.
const FAMILY_WEATHER_FIT = {
  'Aromático limpo': { quente: 85, frio: 55 },
  'Amadeirado executivo': { quente: 50, frio: 80 },
  'Aromático-amadeirado': { quente: 65, frio: 65 },
  'Cítrico esportivo': { quente: 95, frio: 35 },
  'Amadeirado-especiado leve': { quente: 55, frio: 75 },
  'Amadeirado sensual': { quente: 35, frio: 85 },
  'Amadeirado-doce statement': { quente: 30, frio: 85 },
  'Amadeirado-especiado elegante': { quente: 45, frio: 80 },
}

const FRAGRANCE_WEIGHTS = { ocasiao: 70, clima: 30 }

function fragranceOcasiaoSubScore(perfume, contextId) {
  const nativeOccasion = FAMILY_NATIVE_OCCASION[perfume.familia]
  if (!nativeOccasion || !contextId) return { value: null, reasons: [] }
  if (nativeOccasion === contextId) return { value: 100, reasons: ['família pensada exatamente pra essa ocasião'] }
  const value = Math.round(Math.max(0, 100 - occasionDistance(nativeOccasion, contextId)))
  const reasons = value >= 70 ? ['família próxima do que essa ocasião pede'] : []
  return { value, reasons }
}

function fragranceClimaSubScore(perfume, weatherBias) {
  if (!weatherBias || weatherBias === 'ameno') return { value: null, reasons: [] }
  const value = FAMILY_WEATHER_FIT[perfume.familia]?.[weatherBias]
  if (value == null) return { value: null, reasons: [] }
  const reasons = []
  if (value >= 85) reasons.push(weatherBias === 'quente' ? 'família leve, combina com dia quente' : 'família com mais corpo, combina com dia frio')
  return { value, reasons }
}

// FragranceScore — pontua CADA perfume cadastrado (não só filtra por
// família exata) contra ocasião + clima, com peso redistribuído quando
// um dos dois não está disponível. Horário/sazonalidade/histórico/
// rotação (citados na especificação) ficam de fora por enquanto — não
// existe registro de "qual perfume você usou quando" no app ainda, e é
// melhor omitir a dimensão do que fingir um dado que não existe.
// Complementa suggestPerfume (que decide A família certa pra ocasião);
// isto aqui ordena o que você JÁ TEM contra qualquer ocasião/clima dados.
export function rankOwnedPerfumes(ownedPerfumes, { contextId = null, weatherBias = null } = {}) {
  return ownedPerfumes
    .map((perfume) => {
      const ocasiao = fragranceOcasiaoSubScore(perfume, contextId)
      const clima = fragranceClimaSubScore(perfume, weatherBias)
      const subScores = { ocasiao: ocasiao.value, clima: clima.value }
      const match = combineWeightedScore(subScores, FRAGRANCE_WEIGHTS, 60)
      const reasons = [...new Set([...ocasiao.reasons, ...clima.reasons])]
      return { perfume, match, subScores, reasons }
    })
    .sort((a, b) => b.match - a.match)
}
