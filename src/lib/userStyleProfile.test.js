import { describe, it, expect } from 'vitest'
import { computeUserStyleProfile, describeStyleProfile } from './userStyleProfile.js'

const dressWatch = { id: 'w1', nome: 'Dress Formal', cor: 'neutro-preto', estilo: 'Dress clássico' }
const sportyWatch = { id: 'w2', nome: 'Diver Esportivo', cor: 'frio-azul', estilo: 'Mergulho esportivo' }

describe('computeUserStyleProfile', () => {
  it('sem dado nenhum, retorna perfil vazio (amostra zero) sem quebrar', () => {
    const profile = computeUserStyleProfile({})
    expect(profile.sampleSize).toBe(0)
    expect(profile.formalityPreference).toBeNull()
    expect(profile.favoriteCategories).toEqual([])
  })

  it('deriva formalidade e cor a partir de choices, ignorando relógios já removidos da coleção', () => {
    const profile = computeUserStyleProfile({
      collection: [dressWatch, sportyWatch],
      choices: [
        { watchId: 'w1', context: 'trabalho' },
        { watchId: 'w1', context: 'trabalho' },
        { watchId: 'removido-da-colecao' },
      ],
      feedback: [],
      favorites: [],
    })
    expect(profile.sampleSize).toBe(2)
    expect(profile.formalityPreference).not.toBeNull()
    expect(profile.contextPreferences.trabalho).toBe(2)
  })

  it('feedback negativo com peso maior que escolha simples pesa mais na média', () => {
    const profile = computeUserStyleProfile({
      collection: [dressWatch, sportyWatch],
      choices: [{ watchId: 'w1' }],
      feedback: [
        { watchId: 'w2', rating: 'love' },
        { watchId: 'w2', rating: 'love' },
      ],
      favorites: [],
    })
    // duas curtidas fortes do esportivo devem puxar a formalidade média
    // pra baixo, mesmo com uma escolha do dress-formal contando também.
    const dressOnly = computeUserStyleProfile({ collection: [dressWatch, sportyWatch], choices: [{ watchId: 'w1' }], feedback: [], favorites: [] })
    expect(profile.formalityPreference).toBeLessThan(dressOnly.formalityPreference)
  })

  it('padrões de rejeição vêm só de feedback dislike com motivo', () => {
    const profile = computeUserStyleProfile({
      collection: [dressWatch],
      choices: [],
      feedback: [
        { watchId: 'w1', rating: 'dislike', reason: 'cor' },
        { watchId: 'w1', rating: 'dislike', reason: 'cor' },
        { watchId: 'w1', rating: 'like' },
      ],
      favorites: [],
    })
    expect(profile.dislikedPatterns[0]).toMatchObject({ id: 'cor', count: 2 })
  })

  it('favoriteCategories vem só de favorites (independe de choices/feedback)', () => {
    const profile = computeUserStyleProfile({
      collection: [dressWatch, sportyWatch],
      choices: [],
      feedback: [],
      favorites: ['w2'],
    })
    expect(profile.favoriteCategories.length).toBeGreaterThan(0)
  })
})

describe('describeStyleProfile', () => {
  it('com amostra pequena, pede mais dados em vez de arriscar uma leitura errada', () => {
    const insights = describeStyleProfile(computeUserStyleProfile({}))
    expect(insights).toHaveLength(1)
    expect(insights[0]).toMatch(/não há dados suficientes/i)
  })

  it('com amostra suficiente, gera frases em linguagem neutra (nunca hardcoded)', () => {
    const profile = computeUserStyleProfile({
      collection: [dressWatch, sportyWatch],
      choices: [{ watchId: 'w1' }, { watchId: 'w1' }, { watchId: 'w1' }, { watchId: 'w1' }],
      feedback: [{ watchId: 'w1', rating: 'love' }],
      favorites: [],
    })
    const insights = describeStyleProfile(profile)
    expect(insights.length).toBeGreaterThan(0)
    expect(insights.some((t) => /formal/i.test(t))).toBe(true)
  })
})
