import { describe, it, expect, beforeEach } from 'vitest'
import { personalBias, daysSince, lastWornDate, exportData, importData, getCollection } from './storage.js'

describe('personalBias', () => {
  it('sem dado suficiente (menos de 4 sinais) não aplica viés', () => {
    expect(personalBias([], [])).toEqual({})
    expect(personalBias([{ group: 'frio' }], [])).toEqual({})
  })

  it('escolhas concentradas num grupo geram viés positivo pra esse grupo e negativo pros outros', () => {
    const choices = Array.from({ length: 6 }, () => ({ group: 'frio' }))
    const bias = personalBias(choices, [])
    expect(bias.frio).toBeGreaterThan(0)
    expect(bias.quente).toBeLessThan(0)
  })

  it('feedback 👎 (dislike) puxa o viés do grupo pra baixo', () => {
    const choices = Array.from({ length: 6 }, () => ({ group: 'frio' }))
    const semFeedback = personalBias(choices, [])
    const comDislikes = personalBias(choices, Array.from({ length: 3 }, () => ({ group: 'frio', rating: 'dislike' })))
    expect(comDislikes.frio).toBeLessThan(semFeedback.frio)
  })

  it('❤️ (love) pesa mais que 👍 (like) na mesma direção', () => {
    // Precisa de um peso concorrente noutro grupo — se "quente" for o
    // único grupo com sinal, a proporção satura em 100% nos dois casos
    // e a diferença de peso (2 vs 1) desaparece no resultado.
    const baseline = Array.from({ length: 6 }, () => ({ group: 'neutro' }))
    const love = personalBias(baseline, [{ group: 'quente', rating: 'love' }])
    const like = personalBias(baseline, [{ group: 'quente', rating: 'like' }])
    expect(love.quente).toBeGreaterThan(like.quente)
  })
})

describe('daysSince / lastWornDate', () => {
  it('retorna Infinity quando não há data', () => {
    expect(daysSince(null)).toBe(Infinity)
  })

  it('calcula diferença em dias de calendário, não em horas corridas', () => {
    const ontem = new Date()
    ontem.setUTCDate(ontem.getUTCDate() - 1)
    expect(daysSince(ontem.toISOString().slice(0, 10))).toBe(1)
  })

  it('lastWornDate acha a entrada mais recente do relógio pedido', () => {
    const history = [
      { watchId: 'a', date: '2024-01-01' },
      { watchId: 'b', date: '2024-02-01' },
    ]
    expect(lastWornDate('b', history)).toBe('2024-02-01')
    expect(lastWornDate('c', history)).toBeNull()
  })
})

describe('backup versionado (export/import)', () => {
  beforeEach(() => localStorage.clear())

  it('exporta no formato v2, com tênis/perfumes agrupados sob wardrobe', () => {
    const data = exportData()
    expect(data.version).toBe(2)
    expect(data.wardrobe).toHaveProperty('sneakers')
    expect(data.wardrobe).toHaveProperty('perfumes')
    expect(data.wardrobe).toHaveProperty('items')
  })

  it('importa um backup v2 válido sem lançar erro', () => {
    const before = getCollection()
    expect(() =>
      importData({ collection: before, wardrobe: { sneakers: [{ id: 's1', nome: 'Teste', hexes: ['#fff'] }], perfumes: [] } }),
    ).not.toThrow()
    expect(getCollection()).toEqual(before)
  })

  it('importa um backup v1 antigo (sneakers/perfumes soltos na raiz)', () => {
    const before = getCollection()
    expect(() => importData({ collection: before, sneakers: [{ id: 's1', nome: 'Legado', hexes: ['#000'] }], perfumes: [] })).not.toThrow()
    expect(getCollection()).toEqual(before)
  })

  it('rejeita JSON sem coleção de relógios, sem alterar o estado atual', () => {
    const before = getCollection()
    expect(() => importData({ nada: 'a ver' })).toThrow()
    expect(getCollection()).toEqual(before)
  })

  it('rejeita item de coleção sem id/nome, sem alterar o estado atual', () => {
    const before = getCollection()
    expect(() => importData({ collection: [{ marca: 'X' }] })).toThrow()
    expect(getCollection()).toEqual(before)
  })
})
