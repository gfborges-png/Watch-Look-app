// Tênis/calçados de demonstração — mesmo papel de data/watches.js e
// data/accessories.js: acervo inicial pra POC não abrir vazia. Cobre os
// 4 tipos de calçado (Tênis/Sapato social/Bota/Loafer) e uma variação
// de cor, pra SneakerScore ter o que comparar contra qualquer ocasião/
// clima desde o primeiro uso. `hexes` usa as cores exatas de
// matchEngine.LOOK_COLORS quando possível, pra harmonia cromática bater
// com precisão máxima nos exemplos.
export const sneakers = [
  {
    id: 'common-projects-achilles-low',
    nome: 'Achilles Low',
    marca: 'Common Projects',
    tipo: 'Tênis',
    hexes: ['#F5F3EE'],
  },
  {
    id: 'adidas-samba-og',
    nome: 'Samba OG',
    marca: 'Adidas',
    tipo: 'Tênis',
    hexes: ['#1B1B1D', '#F5F3EE'],
  },
  {
    id: 'new-balance-990v6',
    nome: '990v6',
    marca: 'New Balance',
    tipo: 'Tênis',
    hexes: ['#8C8C8C'],
  },
  {
    id: 'air-jordan-1-high-chicago',
    nome: 'Air Jordan 1 High Chicago',
    marca: 'Nike',
    tipo: 'Tênis',
    hexes: ['#C23B3B', '#1B1B1D'],
  },
  {
    id: 'veja-campo',
    nome: 'Campo',
    marca: 'Veja',
    tipo: 'Tênis',
    hexes: ['#F5F3EE', '#1F3D2B'],
  },
  {
    id: 'churchs-oxford-preto',
    nome: 'Oxford Preto',
    marca: "Church's",
    tipo: 'Sapato social',
    hexes: ['#1B1B1D'],
  },
  {
    id: 'ferragamo-gancini-loafer',
    nome: 'Gancini Loafer',
    marca: 'Ferragamo',
    tipo: 'Loafer',
    hexes: ['#6B4423'],
  },
  {
    id: 'red-wing-iron-ranger',
    nome: 'Iron Ranger',
    marca: 'Red Wing',
    tipo: 'Bota',
    hexes: ['#6B4423'],
  },
]
