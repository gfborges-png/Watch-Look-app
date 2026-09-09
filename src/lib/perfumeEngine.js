// Sugestão de perfume por clima + ocasião. Recomenda família olfativa e
// intensidade de aplicação, com referências reais conhecidas de cada
// família como ponto de partida — não é "o perfume certo pra você", é
// "aqui está o tipo de coisa que combina, e alguns exemplos famosos pra
// você ter uma régua".

const WEATHER_KEYS = ['quente', 'frio', 'ameno']
const CONTEXT_KEYS = ['trabalho', 'casual', 'fimDeSemana']

// Uma combinação por clima × ocasião — família e personalidade mudam com
// as duas coisas, não só a intensidade da borrifada.
const MATRIX = {
  quente_trabalho: {
    familia: 'Cítrico limpo',
    descritores: ['bergamota', 'chá verde', 'almíscar leve'],
    porque: 'calor + escritório pede leveza total — fresco e discreto, sem nenhuma doçura que pese',
    referencias: ['Bvlgari Pour Homme', 'Acqua di Parma Colonia'],
  },
  quente_casual: {
    familia: 'Cítrico-aquático',
    descritores: ['bergamota', 'limão-siciliano', 'notas marinhas'],
    porque: 'calor pede fragrância leve e fresca — nada que "cozinhe" na pele ao longo do dia',
    referencias: ['Davidoff Cool Water', 'Dolce & Gabbana Light Blue Pour Homme'],
  },
  quente_fimDeSemana: {
    familia: 'Cítrico-especiado',
    descritores: ['laranja', 'pimenta-rosa', 'gengibre'],
    porque: 'ainda fresco pro calor, mas com um toque picante — sai do óbvio sem virar pesado',
    referencias: ['Tom Ford Neroli Portofino', "Hermès Terre d'Hermès Eau Intense"],
  },
  frio_trabalho: {
    familia: 'Amadeirado seco',
    descritores: ['cedro', 'vetiver', 'almíscar'],
    porque: 'frio segura bem madeira seca — sóbrio, profissional, projeta pouco',
    referencias: ["Hermès Terre d'Hermès EDT", 'Chanel Bleu de Chanel EDT'],
  },
  frio_casual: {
    familia: 'Amadeirado-aromático',
    descritores: ['cedro', 'lavanda', 'âmbar leve'],
    porque: 'frio deixa a madeira mais confortável de usar o dia todo, sem parecer forçado',
    referencias: ['Dior Homme', 'Giorgio Armani Acqua di Giò Profumo'],
  },
  frio_fimDeSemana: {
    familia: 'Amadeirado-especiado',
    descritores: ['âmbar', 'cardamomo', 'baunilha seca', 'cedro'],
    porque: 'frio segura melhor fragrâncias densas — aproveita pra usar algo com mais corpo à noite',
    referencias: ['Tom Ford Tobacco Vanille', 'Yves Saint Laurent Y EDP'],
  },
  ameno_trabalho: {
    familia: 'Aromático limpo',
    descritores: ['lavanda', 'vetiver', 'almíscar limpo'],
    porque: 'sem clima extremo, o mais seguro pro escritório é limpo e versátil',
    referencias: ['Chanel Bleu de Chanel EDT', 'Prada L’Homme'],
  },
  ameno_casual: {
    familia: 'Aromático-amadeirado',
    descritores: ['lavanda', 'cedro', 'toque cítrico'],
    porque: 'clima ameno é o mais versátil — vai bem em quase qualquer família equilibrada',
    referencias: ['Dior Homme', 'Chanel Bleu de Chanel EDP'],
  },
  ameno_fimDeSemana: {
    familia: 'Amadeirado-especiado leve',
    descritores: ['cardamomo', 'cedro', 'âmbar claro'],
    porque: 'um degrau mais ousado que o dia a dia, sem depender de calor ou frio extremos',
    referencias: ['Yves Saint Laurent Y EDP', 'Versace Eros'],
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
