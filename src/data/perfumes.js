// Perfumes de demonstração — mesmo papel de data/watches.js e
// data/accessories.js: acervo inicial pra POC não abrir vazia. Um por
// família olfativa conhecida (ver KNOWN_FAMILIES em perfumeEngine.js),
// usando as mesmas referências de nicho/árabe/tradicional já sugeridas
// por ocasião — assim "da sua coleção" já aparece pra qualquer clima/
// ocasião desde o primeiro uso, sem precisar cadastrar nada. `notas`
// reaproveita os descritores do perfil da ocasião correspondente, pra o
// ajuste fino de clima (notesWeatherFit) já funcionar de cara.
export const perfumes = [
  {
    id: 'guerlain-vetiver',
    nome: 'Vétiver',
    marca: 'Guerlain',
    familia: 'Aromático limpo',
    notas: 'lavanda, vetiver, almíscar limpo',
  },
  {
    id: 'amouage-reflection-man',
    nome: 'Reflection Man',
    marca: 'Amouage',
    familia: 'Amadeirado executivo',
    notas: 'vetiver, cedro, âmbar seco',
  },
  {
    id: 'creed-green-irish-tweed',
    nome: 'Green Irish Tweed',
    marca: 'Creed',
    familia: 'Aromático-amadeirado',
    notas: 'lavanda, cedro, toque cítrico',
  },
  {
    id: '4711-original-eau-de-cologne',
    nome: 'Original Eau de Cologne',
    marca: '4711',
    familia: 'Cítrico esportivo',
    notas: 'bergamota, notas aquáticas, almíscar limpo',
  },
  {
    id: 'nishane-hacivat',
    nome: 'Hacivat',
    marca: 'Nishane',
    familia: 'Amadeirado-especiado leve',
    notas: 'cardamomo, cedro, âmbar claro',
  },
  {
    id: 'amouage-interlude-man',
    nome: 'Interlude Man',
    marca: 'Amouage',
    familia: 'Amadeirado sensual',
    notas: 'âmbar, especiarias doces, toque de oud',
  },
  {
    id: 'kilian-angels-share',
    nome: "Angels' Share",
    marca: 'Kilian',
    familia: 'Amadeirado-doce statement',
    notas: 'baunilha, tabaco, especiarias',
  },
  {
    id: 'amouage-jubilation-xxv-man',
    nome: 'Jubilation XXV Man',
    marca: 'Amouage',
    familia: 'Amadeirado-especiado elegante',
    notas: 'âmbar, baunilha seca, cedro, cardamomo',
  },
]
