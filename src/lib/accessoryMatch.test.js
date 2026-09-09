import { describe, it, expect } from 'vitest'
import { scoreAccessoriesForLook, pickAccessoriesForLook, accessoryJustification } from './accessoryMatch.js'

const relogioBold = { nome: 'Bold', cor: 'quente-dourado', estilo: 'Racing statement esportivo chamativo', hexes: ['#c9a227'], accent: '#c9a227', pulseira: 'Aço' }
const relogioDiscreto = { nome: 'Discreto', cor: 'neutro-preto', estilo: 'Dress clássico elegante', hexes: ['#1B1B1D'], pulseira: 'Couro' }

const pulseiraCouroPreta = {
  id: 'acc-1',
  type: 'pulseira',
  name: 'Pulseira de couro preta',
  brand: '',
  primaryColor: '#1B1B1D',
  material: 'couro',
  style: ['minimalista', 'classico'],
  watchCompatibility: 'yes',
  image: null,
}

const pulseiraFashionColorida = {
  id: 'acc-2',
  type: 'pulseira',
  name: 'Pulseira statement colorida',
  brand: '',
  primaryColor: '#E8722C',
  material: 'resina',
  style: ['fashion', 'criativo'],
  watchCompatibility: 'yes',
  image: null,
}

const pulseiraIncompativel = {
  id: 'acc-3',
  type: 'pulseira',
  name: 'Pulseira que não combina com relógio',
  brand: '',
  primaryColor: '#1B1B1D',
  material: 'couro',
  style: ['minimalista'],
  watchCompatibility: 'no',
  image: null,
}

describe('scoreAccessoriesForLook', () => {
  it('watchCompatibility="no" nunca aparece ao lado de um relógio (filtrado, não só penalizado)', () => {
    const results = scoreAccessoriesForLook([pulseiraIncompativel], { watch: relogioBold })
    expect(results).toHaveLength(0)
  })

  it('watchCompatibility="no" ainda pontua normalmente quando NÃO há relógio no resultado (ex: só olhando o acessório isolado)', () => {
    const results = scoreAccessoriesForLook([pulseiraIncompativel], { watch: null })
    expect(results).toHaveLength(1)
  })

  it('relógio visualmente marcante favorece acessório discreto sobre um ousado', () => {
    const [discreto] = scoreAccessoriesForLook([pulseiraCouroPreta], { watch: relogioBold })
    const [ousado] = scoreAccessoriesForLook([pulseiraFashionColorida], { watch: relogioBold })
    expect(discreto.match).toBeGreaterThan(ousado.match)
    expect(discreto.reasons).toContain('mantido discreto porque o relógio já é o elemento mais marcante')
  })

  it('cor idêntica ao relógio pontua alto em continuidade', () => {
    const [top] = scoreAccessoriesForLook([pulseiraCouroPreta], { referenceHexes: ['#1B1B1D'] })
    expect(top.subScores.cor).toBeGreaterThanOrEqual(90)
  })

  it('material de couro combina bem com calçado de couro (sapato social)', () => {
    const [top] = scoreAccessoriesForLook([pulseiraCouroPreta], { sneaker: { tipo: 'Sapato social' } })
    expect(top.subScores.material).toBeGreaterThanOrEqual(85)
  })

  it('formalidade: pulseira minimalista/clássica pontua melhor pra reunião importante que pra treino', () => {
    const [reuniao] = scoreAccessoriesForLook([pulseiraCouroPreta], { contextId: 'reuniaoImportante' })
    const [treino] = scoreAccessoriesForLook([pulseiraCouroPreta], { contextId: 'treino' })
    expect(reuniao.subScores.formalidade).toBeGreaterThan(treino.subScores.formalidade)
  })

  it('metal do acessório conversa com pulseira de relógio metálica', () => {
    const pulseiraAco = { ...pulseiraCouroPreta, id: 'acc-4', material: 'aco' }
    const [top] = scoreAccessoriesForLook([pulseiraAco], { watch: relogioBold })
    expect(top.reasons).toContain('o metal conversa com a pulseira do relógio')
  })

  it('sem nenhum sinal (sem relógio/cor/ocasião/calçado), ainda devolve um match válido (nunca quebra)', () => {
    const [top] = scoreAccessoriesForLook([pulseiraCouroPreta], {})
    expect(top.match).toBeGreaterThan(0)
    expect(top.match).toBeLessThanOrEqual(100)
  })

  it('resultados vêm ordenados do maior pro menor match', () => {
    const results = scoreAccessoriesForLook([pulseiraCouroPreta, pulseiraFashionColorida], { watch: relogioBold })
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].match).toBeGreaterThanOrEqual(results[i].match)
    }
  })
})

describe('pickAccessoriesForLook — opcional por natureza', () => {
  it('nunca força um resultado fraco: acervo vazio devolve lista vazia', () => {
    expect(pickAccessoriesForLook([], { watch: relogioDiscreto })).toEqual([])
  })

  it('respeita o piso de relevância (minScore) — um acessório mal ajustado não aparece', () => {
    const picks = pickAccessoriesForLook([pulseiraFashionColorida], { watch: relogioBold, contextId: 'reuniaoImportante' }, { minScore: 90 })
    expect(picks).toHaveLength(0)
  })

  it('nunca devolve mais que `max` itens', () => {
    const acervo = [pulseiraCouroPreta, { ...pulseiraCouroPreta, id: 'acc-5' }, { ...pulseiraCouroPreta, id: 'acc-6' }]
    const picks = pickAccessoriesForLook(acervo, { watch: relogioDiscreto }, { max: 2, minScore: 0 })
    expect(picks.length).toBeLessThanOrEqual(2)
  })
})

describe('accessoryJustification', () => {
  it('usa o motivo mais forte já calculado quando existe', () => {
    const [pick] = scoreAccessoriesForLook([pulseiraCouroPreta], { watch: relogioBold })
    expect(accessoryJustification(pick)).toContain('Pulseira de couro preta')
  })

  it('sem motivo específico, ainda gera uma frase válida (nunca undefined/vazio)', () => {
    const [pick] = scoreAccessoriesForLook([{ ...pulseiraCouroPreta, style: [], watchCompatibility: 'neutral' }], {})
    expect(accessoryJustification(pick)).toBeTruthy()
  })
})
