// Sugestão de perfume por clima + ocasião. Recomenda família olfativa e
// intensidade de aplicação, não marca/frasco específico — o que combina
// com você depende de gosto e do que já tem no armário; a família certa
// (e a mão certa na aplicação) vale pra qualquer coleção de perfumes.

const WEATHER_KEYS = ['quente', 'frio', 'ameno']
const CONTEXT_KEYS = ['trabalho', 'casual', 'fimDeSemana']

// Uma combinação por clima × ocasião — família e personalidade mudam com
// as duas coisas, não só a intensidade da borrifada.
const MATRIX = {
  quente_trabalho: {
    familia: 'Cítrico limpo',
    descritores: ['bergamota', 'chá verde', 'almíscar leve'],
    porque: 'calor + escritório pede leveza total — fresco e discreto, sem nenhuma doçura que pese',
  },
  quente_casual: {
    familia: 'Cítrico-aquático',
    descritores: ['bergamota', 'limão-siciliano', 'notas marinhas'],
    porque: 'calor pede fragrância leve e fresca — nada que "cozinhe" na pele ao longo do dia',
  },
  quente_fimDeSemana: {
    familia: 'Cítrico-especiado',
    descritores: ['laranja', 'pimenta-rosa', 'gengibre'],
    porque: 'ainda fresco pro calor, mas com um toque picante — sai do óbvio sem virar pesado',
  },
  frio_trabalho: {
    familia: 'Amadeirado seco',
    descritores: ['cedro', 'vetiver', 'almíscar'],
    porque: 'frio segura bem madeira seca — sóbrio, profissional, projeta pouco',
  },
  frio_casual: {
    familia: 'Amadeirado-aromático',
    descritores: ['cedro', 'lavanda', 'âmbar leve'],
    porque: 'frio deixa a madeira mais confortável de usar o dia todo, sem parecer forçado',
  },
  frio_fimDeSemana: {
    familia: 'Amadeirado-especiado',
    descritores: ['âmbar', 'cardamomo', 'baunilha seca', 'cedro'],
    porque: 'frio segura melhor fragrâncias densas — aproveita pra usar algo com mais corpo à noite',
  },
  ameno_trabalho: {
    familia: 'Aromático limpo',
    descritores: ['lavanda', 'vetiver', 'almíscar limpo'],
    porque: 'sem clima extremo, o mais seguro pro escritório é limpo e versátil',
  },
  ameno_casual: {
    familia: 'Aromático-amadeirado',
    descritores: ['lavanda', 'cedro', 'toque cítrico'],
    porque: 'clima ameno é o mais versátil — vai bem em quase qualquer família equilibrada',
  },
  ameno_fimDeSemana: {
    familia: 'Amadeirado-especiado leve',
    descritores: ['cardamomo', 'cedro', 'âmbar claro'],
    porque: 'um degrau mais ousado que o dia a dia, sem depender de calor ou frio extremos',
  },
}

const INTENSITY = {
  trabalho: { intensidade: '2-3 borrifadas, EDT — discreto a 1 metro de distância', evitar: 'evita gourmand muito doce ou oud pesado no escritório' },
  casual: { intensidade: '3-4 borrifadas, EDT ou EDP leve', evitar: null },
  fimDeSemana: { intensidade: '4-5 borrifadas, EDP — pode projetar mais', evitar: null },
}

// weatherBias: 'quente' | 'frio' | 'ameno' | null (null cai em 'ameno', o
// perfil mais seguro sem dado de clima). context: 'trabalho' | 'casual' | 'fimDeSemana'.
export function suggestPerfume({ weatherBias, context }) {
  const w = WEATHER_KEYS.includes(weatherBias) ? weatherBias : 'ameno'
  const c = CONTEXT_KEYS.includes(context) ? context : 'casual'
  const combo = MATRIX[`${w}_${c}`]
  const intensity = INTENSITY[c]
  return { ...combo, intensidade: intensity.intensidade, evitar: intensity.evitar }
}
