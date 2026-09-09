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
