// Motor de regras de combinação relógio -> look.
//
// Regras (conforme especificação):
// - QUENTE (dourado, champagne, salmon, whisky) -> bege, cream, marrom, terracota, oliva
// - FRIA (azul, turquesa, verde água) -> branco, cinza, marinho, ou eco cromático
//   (mesma cor do mostrador)
// - TERROSA (verde oliva, verde escuro) -> bege, oliva, marrom, cáqui
// - NEUTRA (preto, branco, prata) -> versátil, prioriza contraste (preto + branco/bege)
// - MISTA / NEUTRA-COM-ACENTO -> base neutra versátil + "pop" da cor de acento real do relógio
// - Tênis branco é sempre sugerido como opção segura de base
// - Looks de trabalho evitam combinações gritantes; looks casuais podem ser mais ousados

export const COLOR_FILTERS = ['quente', 'frio', 'terroso', 'neutro', 'misto']

export const COLOR_LABELS = {
  quente: 'Quente',
  frio: 'Frio',
  terroso: 'Terroso',
  neutro: 'Neutro',
  misto: 'Misto',
  'neutro-quente': 'Neutro',
  'neutro-frio': 'Neutro',
}

const STYLE_RULES = [
  { key: 'dress', label: 'Dress', test: (s) => s.includes('dress') },
  { key: 'racing', label: 'Racing', test: (s) => s.includes('racing') || s.includes('motorsport') },
  { key: 'diver', label: 'Diver', test: (s) => s.includes('diver') },
  { key: 'sport', label: 'Sport', test: (s) => s.includes('sport') },
  { key: 'casual', label: 'Casual', test: (s) => s.includes('casual') },
]

export const STYLE_FILTERS = STYLE_RULES.map((r) => r.key)
export const STYLE_LABELS = Object.fromEntries(STYLE_RULES.map((r) => [r.key, r.label]))

// Retorna as categorias de estilo (dress/sport/casual/racing/diver) de um relógio.
export function getStyleTags(estilo) {
  const s = estilo.toLowerCase()
  return STYLE_RULES.filter((r) => r.test(s)).map((r) => r.key)
}

// Mapeia a cor "crua" do relógio para o grupo de cor exibido no filtro.
export function getColorFilterGroup(cor) {
  if (cor === 'quente' || cor === 'frio' || cor === 'terroso' || cor === 'neutro') return cor
  if (cor === 'misto') return 'misto'
  if (cor.startsWith('neutro-')) return 'neutro'
  return 'neutro'
}

// Grupo de paleta usado pelo motor de looks (quente/frio/terroso/neutro).
// Combinações mistas ou "neutro-x" partem de uma base neutra versátil,
// com um "pop" de cor extraído do campo accent do próprio relógio.
export function paletteGroup(cor) {
  if (cor === 'quente' || cor === 'frio' || cor === 'terroso') return cor
  return 'neutro'
}

const SAFE_SHOE = 'Tênis branco'

export const PALETTES = {
  quente: {
    nome: 'Paleta quente',
    cores: ['bege', 'cream', 'marrom', 'terracota', 'oliva'],
    regra:
      'Mostrador em tom quente (dourado, champagne, salmon ou whisky) pede roupas que aqueçam junto: bege, cream, marrom, terracota e oliva.',
    tops: ['Camisa de linho bege', 'Camiseta piquet terracota', 'Camisa social cream'],
    bottoms: ['Calça de alfaiataria marrom', 'Chino oliva', 'Calça bege'],
    shoesDress: 'Sapato de couro whisky',
    shoesBold: 'Tênis terracota ou marrom',
    layers: ['Blazer oliva', 'Jaqueta suede marrom'],
  },
  frio: {
    nome: 'Paleta fria',
    cores: ['branco', 'cinza', 'marinho'],
    regra:
      'Mostrador em tom frio (azul, turquesa ou verde água) combina com branco, cinza e marinho — ou com eco cromático, repetindo a cor do mostrador na roupa.',
    tops: ['Camisa branca', 'Camiseta cinza mescla', 'Camisa azul-marinho'],
    bottoms: ['Calça cinza-chumbo', 'Jeans azul escuro', 'Calça marinho'],
    shoesDress: 'Sapato de couro preto',
    shoesBold: 'Tênis branco com detalhe na cor do mostrador',
    layers: ['Blazer marinho', 'Jaqueta cinza'],
  },
  terroso: {
    nome: 'Paleta terrosa',
    cores: ['bege', 'oliva', 'marrom', 'cáqui'],
    regra:
      'Mostrador terroso (verde oliva, verde escuro) pede paleta de mata: bege, oliva, marrom e cáqui.',
    tops: ['Camiseta cáqui', 'Camisa oliva', 'Camisa bege'],
    bottoms: ['Calça marrom', 'Chino cáqui', 'Calça oliva'],
    shoesDress: 'Bota de couro marrom',
    shoesBold: 'Tênis oliva ou cáqui',
    layers: ['Jaqueta utilitária oliva'],
  },
  neutro: {
    nome: 'Paleta neutra',
    cores: ['preto', 'branco', 'bege', 'cinza'],
    regra:
      'Mostrador neutro (preto, branco ou prata) é o mais versátil: combina com qualquer paleta, mas o efeito mais elegante é o contraste — preto com branco ou bege.',
    tops: ['Camisa branca', 'Camiseta preta', 'Camisa cinza'],
    bottoms: ['Calça preta', 'Jeans cinza', 'Calça bege'],
    shoesDress: 'Sapato de couro preto',
    shoesBold: 'Tênis branco com pop de cor',
    layers: ['Blazer preto', 'Jaqueta bomber cinza'],
  },
}

function isDressStyle(estilo) {
  const s = estilo.toLowerCase()
  return s.includes('dress') || s.includes('elegante') || s.includes('smart') || s.includes('refinado')
}

// Gera 3 sugestões de look completo para um relógio, seguindo as regras acima.
export function generateLooks(watch) {
  const group = paletteGroup(watch.cor)
  const pal = PALETTES[group]
  const dressy = isDressStyle(watch.estilo)
  const blended = watch.cor === 'misto' || watch.cor.startsWith('neutro-')

  const looks = []

  // Look 1 — Trabalho: contido, sem combinações gritantes.
  looks.push({
    contexto: 'Trabalho',
    top: pal.tops[0],
    bottom: pal.bottoms[0],
    tenis: dressy ? pal.shoesDress : SAFE_SHOE,
    camadaExtra: dressy ? pal.layers[0] : null,
    porque: `${pal.regra} Para o escritório, mantemos a combinação contida — nada de tons gritantes.`,
  })

  // Look 2 — Casual: mais leve, com camada extra opcional.
  looks.push({
    contexto: 'Casual',
    top: pal.tops[1],
    bottom: pal.bottoms[1],
    tenis: SAFE_SHOE,
    camadaExtra: pal.layers[pal.layers.length > 1 ? 1 : 0],
    porque: `Base ${pal.nome.toLowerCase()} (${pal.cores.join(', ')}) com o tênis branco como opção segura, e uma camada extra pra dar acabamento ao look do dia a dia.`,
  })

  // Look 3 — Fim de semana / bold: eco cromático (frio), contraste (neutro),
  // ou pop de acento real do relógio (misto / neutro-quente / neutro-frio).
  if (blended && watch.accent) {
    looks.push({
      contexto: 'Fim de semana (bold)',
      top: `Camiseta ou camisa em ${watch.accent}`,
      bottom: pal.bottoms[2] ?? pal.bottoms[0],
      tenis: SAFE_SHOE,
      camadaExtra: null,
      porque: `Mostrador combina tons distintos (${watch.accent}) — a base fica neutra e versátil, e o "pop" de cor entra em uma peça só, para não competir com o relógio.`,
    })
  } else if (group === 'frio') {
    looks.push({
      contexto: 'Fim de semana (eco cromático)',
      top: `Camiseta em ${watch.accent ?? 'tom próximo ao mostrador'} (eco cromático)`,
      bottom: pal.bottoms[2] ?? pal.bottoms[0],
      tenis: SAFE_SHOE,
      camadaExtra: null,
      porque: 'Repetir a cor do mostrador na roupa cria eco cromático — um efeito proposital de "combinar com o próprio relógio".',
    })
  } else if (group === 'neutro') {
    looks.push({
      contexto: 'Fim de semana (contraste)',
      top: 'Camiseta branca ou bege',
      bottom: 'Calça preta',
      tenis: SAFE_SHOE,
      camadaExtra: null,
      porque: 'Com mostrador neutro, o contraste preto + branco/bege é o combo mais elegante e à prova de erro.',
    })
  } else {
    looks.push({
      contexto: 'Fim de semana (bold)',
      top: group === 'quente' ? 'Camiseta terracota' : 'Camiseta cáqui',
      bottom: group === 'quente' ? 'Calça oliva' : 'Calça marrom',
      tenis: SAFE_SHOE,
      camadaExtra: pal.layers[0],
      porque: `Fora do trabalho dá pra ousar mais dentro da própria ${pal.nome.toLowerCase()}, puxando para as cores mais saturadas da paleta.`,
    })
  }

  return looks
}

// Trabalho/Casual/Fim de semana já têm um look dedicado em generateLooks
// (posições fixas — o antigo casamento por prefixo de label era frágil
// e caía silenciosamente pro look de Trabalho pra qualquer ocasião fora
// dessas 3). Índice, não texto, então não quebra se o rótulo mudar.
const CURATED_LOOK_INDEX = { trabalho: 0, casual: 1, fimDeSemana: 2 }

// Vocabulário de peça pras 5 ocasiões que generateLooks não cobre —
// GARMENT, não cor: a cor ainda vem da paleta do mostrador (pal), mas o
// TIPO de peça é definido pela ocasião. Bug real que isso corrige: sem
// isso, "Treino" caía no fallback de Trabalho e sugeria camisa social/
// de linho — nunca certo pra suar a camisa (literalmente) numa academia.
const EXTRA_OCCASION_LOOKS = {
  reuniaoImportante: (pal) => ({
    contexto: 'Reunião importante',
    top: pal.tops[2] ?? pal.tops[0],
    bottom: pal.bottoms[0],
    tenis: pal.shoesDress,
    camadaExtra: pal.layers[0],
    porque: `${pal.regra} Reunião de peso pede o registro mais formal da paleta — blazer e sapato, sem tênis.`,
  }),
  treino: (pal) => ({
    contexto: 'Treino',
    top: `Camiseta dry-fit ${pal.cores[0]}`,
    bottom: 'Bermuda ou legging de treino',
    tenis: 'Tênis de treino',
    camadaExtra: null,
    porque: 'Treino pede tecido técnico que respira e liberdade de movimento — sem alfaiataria, sem camada extra, por mais que a cor combine.',
  }),
  jantarRomantico: (pal) => ({
    contexto: 'Jantar romântico',
    top: pal.tops[2] ?? pal.tops[0],
    bottom: pal.bottoms[0],
    tenis: pal.shoesDress,
    camadaExtra: null,
    porque: `${pal.regra} Clima íntimo pede o registro mais elegante da paleta, sem camada extra que esfrie o visual.`,
  }),
  festa: (pal) => ({
    contexto: 'Festa',
    top: pal.tops[1],
    bottom: pal.bottoms[2] ?? pal.bottoms[0],
    tenis: pal.shoesBold,
    camadaExtra: null,
    porque: `${pal.regra} Fim de noite pede o lado mais ousado da paleta — sem medo do tênis statement.`,
  }),
  casamento: (pal) => ({
    contexto: 'Casamento',
    top: pal.tops[2] ?? pal.tops[0],
    bottom: pal.bottoms[0],
    tenis: pal.shoesDress,
    camadaExtra: pal.layers[0],
    porque: `${pal.regra} Ocasião de peso e o dia inteiro de duração pedem o registro mais formal, com blazer.`,
  }),
}

// Look pra QUALQUER uma das 8 ocasiões de matchEngine.CONTEXTS — usado
// pela Home/Montar (dailyRecommendation.js), que precisa de resposta
// certa pra todas, ao contrário do preview de 3 looks de generateLooks
// (esse continua só ilustrativo, na tela de detalhe do relógio).
export function lookForOccasion(watch, contextId) {
  if (contextId in CURATED_LOOK_INDEX) {
    return generateLooks(watch)[CURATED_LOOK_INDEX[contextId]]
  }
  const pal = PALETTES[paletteGroup(watch.cor)]
  const build = EXTRA_OCCASION_LOOKS[contextId]
  return build ? build(pal) : generateLooks(watch)[0]
}
