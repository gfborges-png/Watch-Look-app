import { describe, it, expect } from 'vitest'
import { rotationScore, rotationLevel, isForgotten, usageStats, FORGOTTEN_THRESHOLD_DAYS } from './rotationEngine.js'
import { daysAgoStr } from './test-helpers.js'

describe('rotationScore', () => {
  it('relógio usado ontem tem rotação baixa (não é bom candidato pra hoje)', () => {
    const history = [{ watchId: 'w1', date: daysAgoStr(1) }]
    expect(rotationScore('w1', history)).toBeLessThan(40)
  })

  it('relógio parado há 30+ dias tem rotação alta (bom candidato)', () => {
    const history = [{ watchId: 'w1', date: daysAgoStr(35) }]
    expect(rotationScore('w1', history)).toBeGreaterThan(70)
  })

  it('quanto mais tempo parado, maior a rotação — ordem consistente', () => {
    const pouco = rotationScore('w1', [{ watchId: 'w1', date: daysAgoStr(5) }])
    const medio = rotationScore('w1', [{ watchId: 'w1', date: daysAgoStr(20) }])
    const muito = rotationScore('w1', [{ watchId: 'w1', date: daysAgoStr(60) }])
    expect(muito).toBeGreaterThanOrEqual(medio)
    expect(medio).toBeGreaterThanOrEqual(pouco)
  })

  it('relógio nunca usado recebe rotação alta, mas conservadora (não é garantia de combinar)', () => {
    const score = rotationScore('nunca-usado', [{ watchId: 'outro', date: daysAgoStr(35) }])
    expect(score).toBeGreaterThanOrEqual(70)
    expect(score).toBeLessThan(95)
  })

  it('uso repetido recente penaliza mesmo mantendo a mesma data do último uso', () => {
    const usoUnico = rotationScore('w1', [{ watchId: 'w1', date: daysAgoStr(5) }])
    const usoRepetido = rotationScore('w1', [
      { watchId: 'w1', date: daysAgoStr(5) },
      { watchId: 'w1', date: daysAgoStr(4) },
      { watchId: 'w1', date: daysAgoStr(2) },
    ])
    expect(usoRepetido).toBeLessThanOrEqual(usoUnico)
  })
})

describe('isForgotten', () => {
  it('marca como esquecido depois do limite de dias parado', () => {
    expect(isForgotten('w1', [{ watchId: 'w1', date: daysAgoStr(FORGOTTEN_THRESHOLD_DAYS + 5) }])).toBe(true)
    expect(isForgotten('w1', [{ watchId: 'w1', date: daysAgoStr(5) }])).toBe(false)
  })

  it('relógio nunca registrado conta como esquecido', () => {
    expect(isForgotten('nunca', [])).toBe(true)
  })
})

describe('rotationLevel', () => {
  it('reflete a frequência de uso nos últimos 90 dias', () => {
    const usoFrequente = Array.from({ length: 10 }, (_, i) => ({ watchId: 'w1', date: daysAgoStr(i * 5) }))
    expect(rotationLevel('w1', usoFrequente)).toBe('alta')
    expect(rotationLevel('w1', [])).toBe('baixa')
  })
})

describe('usageStats', () => {
  it('conta usos dentro de cada janela (7/30/90 dias) corretamente', () => {
    const history = [
      { watchId: 'w1', date: daysAgoStr(2) },
      { watchId: 'w1', date: daysAgoStr(10) },
      { watchId: 'w1', date: daysAgoStr(40) },
      { watchId: 'outro', date: daysAgoStr(1) },
    ]
    const stats = usageStats('w1', history)
    expect(stats.uses7).toBe(1)
    expect(stats.uses30).toBe(2)
    expect(stats.uses90).toBe(3)
  })
})
