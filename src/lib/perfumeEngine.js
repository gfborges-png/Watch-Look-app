// Sugestão de perfume por ocasião (+ clima como ajuste fino). Recomenda
// família olfativa e intensidade de aplicação, com referências reais
// conhecidas de cada família como ponto de partida — não é "o perfume
// certo pra você", é "aqui está o tipo de coisa que combina, e alguns
// exemplos famosos pra você ter uma régua". `referencias` são sempre
// perfumaria de nicho, árabe ou tradicional/de herança — nunca o
// designer mainstream óbvio (Chanel/Dior/Versace...) — o "da sua
// coleção" (campo `owned`, ver suggestPerfume) já cobre o que a pessoa
// realmente tem; a referência genérica é pensada como descoberta, não
// como redundância do óbvio.
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
    referencias: ['Guerlain Vétiver', 'Ormonde Jayne Zizan'],
    intensidade: '2-3 borrifadas, EDT — discreto a 1 metro de distância',
    evitar: 'evita gourmand muito doce ou oud pesado no escritório',
  },
  reuniaoImportante: {
    familia: 'Amadeirado executivo',
    descritores: ['vetiver', 'cedro', 'âmbar seco'],
    porque: 'reunião de peso pede presença sem ostentação — amadeirado seco projeta confiança de perto, sem tomar a sala',
    referencias: ['Amouage Reflection Man', 'Ajmal Amber Wood'],
    intensidade: '2-3 borrifadas, EDP — notável a 1 metro, não além',
    evitar: 'evita notas muito doces ou adocicadas — o objetivo é sobriedade',
  },
  casual: {
    familia: 'Aromático-amadeirado',
    descritores: ['lavanda', 'cedro', 'toque cítrico'],
    porque: 'dia a dia pede o mais versátil — vai bem em quase qualquer situação sem chamar atenção demais',
    referencias: ['Creed Green Irish Tweed', 'Nishane Ani'],
    intensidade: '3-4 borrifadas, EDT ou EDP leve',
    evitar: null,
  },
  treino: {
    familia: 'Cítrico esportivo',
    descritores: ['bergamota', 'notas aquáticas', 'almíscar limpo'],
    porque: 'treino pede o mínimo possível — o objetivo é só ficar limpo, não competir com o esforço físico',
    referencias: ['4711 Original Eau de Cologne', 'Escentric Molecules Escentric 01'],
    intensidade: '1-2 borrifadas, ou nenhuma — o banho pós-treino já resolve',
    evitar: 'evita qualquer coisa doce, amadeirada pesada ou muito concentrada',
  },
  fimDeSemana: {
    familia: 'Amadeirado-especiado leve',
    descritores: ['cardamomo', 'cedro', 'âmbar claro'],
    porque: 'fora do expediente dá pra ousar um degrau — mais corpo que o dia a dia, sem exagerar',
    referencias: ['Nishane Hacivat', 'Rasasi Hawas'],
    intensidade: '4-5 borrifadas, EDP — pode projetar mais',
    evitar: null,
  },
  jantarRomantico: {
    familia: 'Amadeirado sensual',
    descritores: ['âmbar', 'especiarias doces', 'toque de oud'],
    porque: 'clima íntimo pede algo mais quente e sedutor, mas projetado pra quem está perto — não pro salão inteiro',
    referencias: ['Amouage Interlude Man', 'Ajmal Mukhallat Malaki'],
    intensidade: '3 borrifadas, EDP — presença a curta distância',
    evitar: 'evita fragrâncias muito frescas/aquáticas — o clima pede mais corpo',
  },
  festa: {
    familia: 'Amadeirado-doce statement',
    descritores: ['baunilha', 'tabaco', 'especiarias'],
    porque: 'fim de noite é a hora de sair do seguro do dia a dia — algo com mais personalidade e projeção',
    referencias: ['Kilian Angels’ Share', 'Initio Side Effect'],
    intensidade: '4-5 borrifadas, EDP ou Parfum — pode e deve projetar',
    evitar: null,
  },
  casamento: {
    familia: 'Amadeirado-especiado elegante',
    descritores: ['âmbar', 'baunilha seca', 'cedro', 'cardamomo'],
    porque: 'ocasião de peso e o dia inteiro de duração — pede algo com corpo que aguente sem precisar retocar',
    referencias: ['Amouage Jubilation XXV Man', 'Al Haramain Amber Oud'],
    intensidade: '3-4 borrifadas, EDP — precisa aguentar o dia inteiro',
    evitar: null,
  },
}

const DEFAULT_OCCASION = 'casual'

// Famílias conhecidas pelo motor — usado pra popular o seletor no cadastro
// de perfumes, garantindo que o texto bate exatamente com o que as regras
// geram (senão "da sua coleção" nunca acha nada pra combinar).
export const KNOWN_FAMILIES = [...new Set(Object.values(OCCASION_PROFILES).map((c) => c.familia))]

function normalizeFamilyText(text) {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
}

// Texto livre de família olfativa (ex: importação em lote de perfumes)
// -> uma das KNOWN_FAMILIES exatas, ignorando acento/maiúscula. Sem
// aproximação por palavra-chave (ao contrário de matchColorNameToHexes):
// família errada muda a ocasião inteira que o perfume é sugerido pra,
// então é melhor não achar nada (null, o chamador decide o padrão) do
// que "chutar" uma família parecida.
export function matchFamilyName(text) {
  if (!text) return null
  const target = normalizeFamilyText(String(text))
  return KNOWN_FAMILIES.find((f) => normalizeFamilyText(f) === target) ?? null
}

// Sinais de vocabulário de perfumaria (em texto livre, sem acento) que
// aproximam uma família real pra uma das KNOWN_FAMILIES — usado só como
// fallback de importação em lote, quando matchFamilyName não bate exato.
// Bancos de dados reais raramente usam os nomes de família compostos
// exatos deste app ("Amadeirado-especiado leve" etc.); a alternativa a
// isso não é "nunca errar", é cair sempre na mesma família fixa
// (KNOWN_FAMILIES[0]) pra QUALQUER perfume não reconhecido — o que já é
// um chute, só que sempre o mesmo chute, ignorando por completo o texto
// real da família. Isso aqui lê o texto de verdade; ordem importa (o
// primeiro padrão que bater vence), do sinal mais específico pro mais
// genérico.
const FAMILY_GUESS_PATTERNS = [
  { family: 'Amadeirado sensual', test: /couro|leather|oud|sensual/ },
  { family: 'Amadeirado-doce statement', test: /doce|gourmand|baunilha|vanilla|tabaco|tobacco/ },
  { family: 'Cítrico esportivo', test: /citrico|citrus|aquatico|aquatic|esportivo|marinho/ },
  { family: 'Amadeirado executivo', test: /executivo/ },
  { family: 'Amadeirado-especiado elegante', test: /especiado.*elegante|elegante.*especiado/ },
  { family: 'Amadeirado-especiado leve', test: /especiado|spic/ },
  { family: 'Aromático limpo', test: /fougere|limpo|clean|fresc/ },
  { family: 'Aromático-amadeirado', test: /amadeirado|aromatic|floral/ },
]

// Como matchFamilyName, mas nunca devolve null — tenta o match exato
// primeiro e só depois aproxima por palavra-chave; sem nenhum sinal
// reconhecível, cai em KNOWN_FAMILIES[0] (mesmo comportamento de antes).
export function guessFamilyFromText(text) {
  const exact = matchFamilyName(text)
  if (exact) return exact
  if (!text) return KNOWN_FAMILIES[0]
  const normalized = normalizeFamilyText(String(text))
  const guess = FAMILY_GUESS_PATTERNS.find((p) => p.test.test(normalized))
  return guess?.family ?? KNOWN_FAMILIES[0]
}

// Nomes de campo alternativos que descrições de perfume por pirâmide
// olfativa costumam usar (saída/coração/fundo, ou top/heart/base em
// inglês) — bases de dados reais de fragrância normalmente vêm nesse
// formato, não numa única string "notas". Aceita os dois: se o item já
// tem `notas`, usa direto; senão junta as camadas que existirem.
const TOP_NOTE_KEYS = ['saida', 'saída', 'topo', 'top']
const HEART_NOTE_KEYS = ['coracao', 'coração', 'meio', 'heart']
const BASE_NOTE_KEYS = ['fundo', 'base']

function firstNonEmpty(item, keys) {
  for (const key of keys) {
    const value = item?.[key]
    if (value == null) continue
    const text = String(value).trim()
    if (text && text !== '—' && text !== '-') return text
  }
  return null
}

export function notasFromImportItem(item) {
  const direct = firstNonEmpty(item, ['notas'])
  if (direct) return direct
  const layers = [firstNonEmpty(item, TOP_NOTE_KEYS), firstNonEmpty(item, HEART_NOTE_KEYS), firstNonEmpty(item, BASE_NOTE_KEYS)].filter(Boolean)
  return layers.join(', ')
}

// Piso de relevância pra `owned` (mesma ideia do `minScore` de
// pickAccessoriesForLook): abaixo disso, o perfume cadastrado não é
// próximo o bastante da ocasião de hoje pra valer a pena sugerir.
const FRAGRANCE_RELEVANCE_FLOOR = 55

// weatherBias: 'quente' | 'frio' | 'ameno' | null — só vira uma nota de
// ajuste na concentração, não muda a família. context: um dos ids de
// matchEngine.CONTEXTS. ownedPerfumes: catálogo cadastrado pelo usuário
// (src/lib/storage.js) — os que pontuam bem pro dia de hoje (via
// rankOwnedPerfumes/FragranceScore, não mais um "família === família"
// exato) entram em `owned` pra aparecer como sugestão primária, na
// frente das referências genéricas. Isso importa de verdade porque
// família de perfume importado raramente bate na risca com uma das 8
// famílias internas (ver matchFamilyName): exigir igualdade exata
// deixava `owned` vazio pra quase toda ocasião fora daquela em que a
// família caiu no import — agora um perfume "próximo" (ex: família da
// ocasião de trabalho, mas hoje é fim de semana) ainda pontua o
// bastante pra aparecer, só não em primeiro lugar. Quando a pessoa tem
// mais de um perfume relevante, `owned` vem ordenado por match — as
// notas de cada um (ver notesWeatherFit) também entram na conta.
export function suggestPerfume({ weatherBias, context, ownedPerfumes = [] }) {
  const profile = OCCASION_PROFILES[context] ?? OCCASION_PROFILES[DEFAULT_OCCASION]

  let climaNota = null
  if (weatherBias === 'quente') climaNota = 'Dia quente — prefira a versão mais leve (EDT) dessa família.'
  else if (weatherBias === 'frio') climaNota = 'Dia frio — pode ir na versão mais concentrada (EDP/Parfum) sem medo.'

  const owned = rankOwnedPerfumes(ownedPerfumes, { contextId: context, weatherBias })
    .filter((r) => r.match >= FRAGRANCE_RELEVANCE_FLOOR)
    .map((r) => r.perfume)
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

// Notas (texto livre, cadastradas por perfume) que sinalizam o lado
// fresco/leve (bom pra dias quentes) ou denso/quente (bom pra dias
// frios) de uma fragrância específica — refina o FAMILY_WEATHER_FIT
// genérico da família com o frasco real que a pessoa tem: duas pessoas
// com um "Aromático limpo" cada podem ter notas bem diferentes, e o
// clima de hoje deveria favorecer a mais leve, não tratar as duas como
// idênticas só por família. Cobertura best-effort (PT/EN), não uma
// lista fechada de toda nota de perfumaria que existe.
const FRESH_NOTE_WORDS = [
  'bergamota', 'limão', 'limao', 'laranja', 'toranja', 'grapefruit', 'lima', 'yuzu',
  'cítrico', 'citrico', 'citrus', 'aquático', 'aquatico', 'marinho', 'marine',
  'menta', 'hortelã', 'hortela', 'mint', 'verde', 'green', 'lavanda', 'lavender',
  'chá verde', 'cha verde', 'green tea', 'pepino', 'cucumber', 'melancia', 'watermelon', 'toranja',
]
const WARM_NOTE_WORDS = [
  'baunilha', 'vanilla', 'âmbar', 'ambar', 'amber', 'oud', 'incenso', 'incense',
  'especiaria', 'especiarias', 'canela', 'cinnamon', 'cravo', 'clove', 'cacau', 'cocoa',
  'chocolate', 'couro', 'leather', 'tabaco', 'tobacco', 'patchouli', 'almíscar', 'almiscar', 'musk',
  'sândalo', 'sandalo', 'sandalwood', 'noz-moscada', 'noz moscada', 'nutmeg', 'fava tonka', 'tonka',
]

function normalizeNotesText(text) {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

// Conta quantas palavras de nota fresca vs quente aparecem no texto
// livre de `notas` — null se não reconhecer nenhuma (o chamador cai no
// valor da família, sem regressão pra quem não preencheu notas ainda).
// Quando reconhece, devolve um score 0-100 por weatherBias: puramente
// fresco satura em quente=100/frio=40, puramente quente em frio=100/
// quente=40 — nunca zero, porque "não é o ideal" não é "não serve".
function notesWeatherFit(notas) {
  if (!notas) return null
  const text = normalizeNotesText(notas)
  const freshCount = FRESH_NOTE_WORDS.filter((w) => text.includes(normalizeNotesText(w))).length
  const warmCount = WARM_NOTE_WORDS.filter((w) => text.includes(normalizeNotesText(w))).length
  const total = freshCount + warmCount
  if (total === 0) return null
  const freshShare = freshCount / total
  return {
    quente: Math.round(40 + freshShare * 60),
    frio: Math.round(40 + (1 - freshShare) * 60),
  }
}

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
  const familyValue = FAMILY_WEATHER_FIT[perfume.familia]?.[weatherBias]
  const notesFit = notesWeatherFit(perfume.notas)
  const notesValue = notesFit?.[weatherBias]

  if (notesValue == null && familyValue == null) return { value: null, reasons: [] }

  // Notas refletem o frasco específico que a pessoa cadastrou — pesam
  // mais que a média genérica da família, mas não a ignoram por
  // completo (as notas listadas quase nunca contam a fragrância
  // inteira, só o que a pessoa lembrou de anotar).
  const value =
    notesValue != null && familyValue != null
      ? Math.round(notesValue * 0.65 + familyValue * 0.35)
      : (notesValue ?? familyValue)

  const reasons = []
  if (notesValue != null && notesValue >= 80) {
    reasons.push(weatherBias === 'quente' ? 'notas frescas nesse perfume combinam com dia quente' : 'notas densas nesse perfume combinam com dia frio')
  } else if (value >= 85) {
    reasons.push(weatherBias === 'quente' ? 'família leve, combina com dia quente' : 'família com mais corpo, combina com dia frio')
  }
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
