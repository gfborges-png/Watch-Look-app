import { describe, it, expect } from 'vitest'
import { recommendWatchesForLook, scoreBand } from './recommendationEngine.js'
import { DEFAULT_OUTFIT, CONTEXTS } from './matchEngine.js'
import { watches } from '../data/watches.js'
import { daysAgoStr } from './test-helpers.js'

const relogioFormal = watches.find((w) => w.id === 'corniche-visionnaire') // Dress avant-garde, neutro
const relogioEsportivoBold = watches.find((w) => w.id === 'mido-multifort-gulf') // Racing statement, misto

const lookTrabalho = {
  ...DEFAULT_OUTFIT,
  camisa: { colorId: 'branco', tipo: 'Camisa social' },
  calca: { colorId: 'bege', tipo: 'Alfaiataria' },
}

describe('recommendWatchesForLook — cenários realistas', () => {
  it('camisa branca + calça bege + trabalho + relógio dress/neutro → score alto', () => {
    const [result] = recommendWatchesForLook([relogioFormal], lookTrabalho, 'trabalho', {})
    expect(result.match).toBeGreaterThanOrEqual(75)
    expect(result.band.id === 'excelente' || result.band.id === 'muito-bom' || result.band.id === 'bom').toBe(true)
  })

  it('look formal + relógio esportivo de alto statement → penalizado em relação ao relógio formal', () => {
    const [formal] = recommendWatchesForLook([relogioFormal], lookTrabalho, 'trabalho', {})
    const [esportivo] = recommendWatchesForLook([relogioEsportivoBold], lookTrabalho, 'trabalho', {})
    expect(esportivo.match).toBeLessThan(formal.match)
    expect(esportivo.subScores.ocasiao).toBeLessThan(formal.subScores.ocasiao)
  })

  it('o score do primeiro colocado é absoluto — não é sempre 100 só por ser o melhor da rodada', () => {
    const results = recommendWatchesForLook(watches, lookTrabalho, 'trabalho', {})
    expect(results[0].match).toBeLessThan(100)
    expect(results[0].match).toBeGreaterThan(0)
  })

  it('relógios ordenados do maior pro menor match', () => {
    const results = recommendWatchesForLook(watches, lookTrabalho, 'trabalho', {})
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].match).toBeGreaterThanOrEqual(results[i].match)
    }
  })
})

describe('sub-scores ausentes ficam null (sugestão parcial, não inventada)', () => {
  it('sem clima/histórico/preferência informados, esses três sub-scores são null', () => {
    const [result] = recommendWatchesForLook([relogioFormal], lookTrabalho, 'trabalho', {})
    expect(result.subScores.clima).toBeNull()
    expect(result.subScores.rotacao).toBeNull()
    expect(result.subScores.preferencia).toBeNull()
    expect(result.subScores.cor).not.toBeNull()
    expect(result.subScores.ocasiao).not.toBeNull()
    expect(result.subScores.estilo).not.toBeNull()
  })

  it('informando clima, histórico e preferência, os sub-scores correspondentes deixam de ser null', () => {
    const [result] = recommendWatchesForLook([relogioFormal], lookTrabalho, 'trabalho', {
      weatherBias: 'quente',
      history: [{ watchId: relogioFormal.id, date: daysAgoStr(10) }],
      personalBias: { neutro: 1 },
    })
    expect(result.subScores.clima).not.toBeNull()
    expect(result.subScores.rotacao).not.toBeNull()
    expect(result.subScores.preferencia).not.toBeNull()
  })

  it('sem nenhuma peça colorida, o sub-score de cor fica null mas ainda retorna um score', () => {
    const [result] = recommendWatchesForLook([relogioFormal], DEFAULT_OUTFIT, 'trabalho', {})
    expect(result.subScores.cor).toBeNull()
    expect(result.match).toBeGreaterThan(0)
  })
})

describe('rotação influencia o match final', () => {
  it('relógio usado ontem vs. mesmo relógio parado há 30 dias — o segundo leva vantagem, mantendo o look igual', () => {
    const usadoOntem = recommendWatchesForLook([relogioFormal], lookTrabalho, 'trabalho', {
      history: [{ watchId: relogioFormal.id, date: daysAgoStr(1) }],
    })[0]
    const paradoHa30 = recommendWatchesForLook([relogioFormal], lookTrabalho, 'trabalho', {
      history: [{ watchId: relogioFormal.id, date: daysAgoStr(35) }],
    })[0]
    expect(paradoHa30.subScores.rotacao).toBeGreaterThan(usadoOntem.subScores.rotacao)
    expect(paradoHa30.match).toBeGreaterThan(usadoOntem.match)
  })
})

describe('ocasiões expandidas (treino, casamento, reunião importante, jantar romântico, festa)', () => {
  it('treino favorece o relógio esportivo sobre o dress, invertendo o resultado do trabalho', () => {
    const [formal] = recommendWatchesForLook([relogioFormal], lookTrabalho, 'treino', {})
    const [esportivo] = recommendWatchesForLook([relogioEsportivoBold], lookTrabalho, 'treino', {})
    expect(esportivo.subScores.ocasiao).toBeGreaterThan(formal.subScores.ocasiao)
  })

  it('casamento e reunião importante favorecem o relógio formal, como o trabalho', () => {
    for (const ocasiao of ['casamento', 'reuniaoImportante']) {
      const [formal] = recommendWatchesForLook([relogioFormal], lookTrabalho, ocasiao, {})
      const [esportivo] = recommendWatchesForLook([relogioEsportivoBold], lookTrabalho, ocasiao, {})
      expect(formal.subScores.ocasiao).toBeGreaterThan(esportivo.subScores.ocasiao)
    }
  })

  it('toda ocasião de matchEngine.CONTEXTS produz um sub-score de ocasião válido (nenhuma fica sem perfil)', () => {
    for (const ctx of CONTEXTS) {
      const [result] = recommendWatchesForLook([relogioFormal], lookTrabalho, ctx.id, {})
      expect(result.subScores.ocasiao, `contexto "${ctx.id}" sem sub-score`).not.toBeNull()
      expect(result.subScores.ocasiao).toBeGreaterThanOrEqual(0)
      expect(result.subScores.ocasiao).toBeLessThanOrEqual(100)
    }
  })
})

describe('scoreBand — faixas de interpretação', () => {
  it('classifica cada faixa corretamente', () => {
    expect(scoreBand(95).id).toBe('excelente')
    expect(scoreBand(90).id).toBe('excelente')
    expect(scoreBand(85).id).toBe('muito-bom')
    expect(scoreBand(75).id).toBe('bom')
    expect(scoreBand(65).id).toBe('funciona')
    expect(scoreBand(40).id).toBe('evitaria')
  })
})
