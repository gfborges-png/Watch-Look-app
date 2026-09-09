import { describe, it, expect } from 'vitest'
import { suggestPerfume, KNOWN_FAMILIES } from './perfumeEngine.js'
import { CONTEXTS } from './matchEngine.js'

describe('suggestPerfume', () => {
  it('toda ocasião de matchEngine.CONTEXTS tem um perfil de perfume completo', () => {
    for (const ctx of CONTEXTS) {
      const p = suggestPerfume({ weatherBias: null, context: ctx.id, ownedPerfumes: [] })
      expect(p.familia, `contexto "${ctx.id}" sem família`).toBeTruthy()
      expect(p.descritores.length).toBeGreaterThan(0)
      expect(p.referencias.length).toBeGreaterThan(0)
      expect(p.intensidade).toBeTruthy()
      expect(KNOWN_FAMILIES).toContain(p.familia)
    }
  })

  it('clima quente/frio vira nota de ajuste, não muda a família', () => {
    const semClima = suggestPerfume({ weatherBias: null, context: 'trabalho' })
    const quente = suggestPerfume({ weatherBias: 'quente', context: 'trabalho' })
    const frio = suggestPerfume({ weatherBias: 'frio', context: 'trabalho' })
    expect(quente.familia).toBe(semClima.familia)
    expect(frio.familia).toBe(semClima.familia)
    expect(quente.climaNota).toBeTruthy()
    expect(frio.climaNota).toBeTruthy()
    expect(semClima.climaNota).toBeFalsy()
  })

  it('perfume cadastrado do usuário aparece em `owned` quando a família bate', () => {
    const p = suggestPerfume({
      weatherBias: null,
      context: 'trabalho',
      ownedPerfumes: [{ id: 'p1', nome: 'Meu Perfume', familia: 'Aromático limpo' }],
    })
    expect(p.owned).toHaveLength(1)
    expect(p.owned[0].nome).toBe('Meu Perfume')
  })
})
