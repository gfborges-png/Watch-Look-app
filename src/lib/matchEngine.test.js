import { describe, it, expect } from 'vitest'
import { colorDistance, netVibe, coloredActiveGarments, DEFAULT_OUTFIT, isWorkStyle, isBoldStyle } from './matchEngine.js'

describe('colorDistance', () => {
  it('cores idênticas têm distância zero', () => {
    expect(colorDistance('#FFFFFF', '#FFFFFF')).toBe(0)
  })

  it('preto e branco têm distância bem maior que duas cores próximas', () => {
    const extremo = colorDistance('#000000', '#FFFFFF')
    const proximo = colorDistance('#F5F3EE', '#FFFFFF')
    expect(extremo).toBeGreaterThan(proximo)
  })
})

describe('netVibe (formalidade agregada do look)', () => {
  it('peças formais (alfaiataria, sapato social) somam vibe positivo', () => {
    expect(netVibe([{ tipo: 'Alfaiataria' }, { tipo: 'Sapato social' }])).toBeGreaterThan(0)
  })

  it('peças casuais (jeans, tênis) somam vibe negativo', () => {
    expect(netVibe([{ tipo: 'Jeans' }, { tipo: 'Tênis' }])).toBeLessThan(0)
  })

  it('peça sem tipo definido não conta pro vibe', () => {
    expect(netVibe([{ tipo: null }])).toBe(0)
  })

  it('look misto (uma formal, uma casual) tende a se equilibrar', () => {
    expect(netVibe([{ tipo: 'Alfaiataria' }, { tipo: 'Tênis' }])).toBe(0)
  })
})

describe('isWorkStyle / isBoldStyle', () => {
  it('reconhece estilo dress/elegante como formal', () => {
    expect(isWorkStyle('Dress avant-garde')).toBe(true)
    expect(isWorkStyle('Sport-casual vintage chrono')).toBe(false)
  })

  it('reconhece estilo statement/bold/racing como ousado', () => {
    expect(isBoldStyle('Racing statement')).toBe(true)
    expect(isBoldStyle('Dress vintage clássico')).toBe(false)
  })
})

describe('coloredActiveGarments', () => {
  it('inclui só as peças com cor escolhida', () => {
    const outfit = { ...DEFAULT_OUTFIT, camisa: { colorId: 'branco', tipo: 'Camisa social' } }
    const colored = coloredActiveGarments(outfit)
    expect(colored).toHaveLength(1)
    expect(colored[0].color.id).toBe('branco')
  })

  it('ignora a jaqueta quando ela está desligada, mesmo com colorId salvo', () => {
    const outfit = { ...DEFAULT_OUTFIT, jaqueta: { enabled: false, colorId: 'preto', tipo: 'Blazer' } }
    expect(coloredActiveGarments(outfit)).toHaveLength(0)
  })

  it('inclui a jaqueta quando ligada e com cor', () => {
    const outfit = { ...DEFAULT_OUTFIT, jaqueta: { enabled: true, colorId: 'marinho', tipo: 'Blazer' } }
    expect(coloredActiveGarments(outfit)).toHaveLength(1)
  })
})
