import { describe, it, expect } from 'vitest'
import { buildMoodeHistory } from './moodeHistory.js'

const watch = { id: 'w1', nome: 'Relógio Teste', cor: 'neutro-preto', hexes: ['#000'] }

describe('buildMoodeHistory', () => {
  it('junta history com o feedback do mesmo relógio/dia (ocasião + score)', () => {
    const history = [{ watchId: 'w1', date: '2026-09-08' }]
    const feedback = [{ watchId: 'w1', rating: 'love', date: '2026-09-08T18:00:00.000Z', context: 'trabalho', match: 87 }]
    const [entry] = buildMoodeHistory(history, feedback, [watch])
    expect(entry.watch.id).toBe('w1')
    expect(entry.context).toBe('trabalho')
    expect(entry.score).toBe(87)
  })

  it('sem feedback correspondente, ainda aparece — só sem ocasião/score (nunca inventa)', () => {
    const history = [{ watchId: 'w1', date: '2026-09-08' }]
    const [entry] = buildMoodeHistory(history, [], [watch])
    expect(entry.watch.id).toBe('w1')
    expect(entry.context).toBeNull()
    expect(entry.score).toBeNull()
  })

  it('relógio removido da coleção depois não aparece (nunca referencia um item inexistente)', () => {
    const history = [{ watchId: 'removido', date: '2026-09-08' }]
    const entries = buildMoodeHistory(history, [], [watch])
    expect(entries).toHaveLength(0)
  })

  it('feedback de outro dia ou outro relógio não é confundido com o certo', () => {
    const history = [{ watchId: 'w1', date: '2026-09-08' }]
    const feedback = [
      { watchId: 'w1', rating: 'love', date: '2026-09-07T18:00:00.000Z', context: 'casual', match: 70 },
      { watchId: 'outro', rating: 'love', date: '2026-09-08T18:00:00.000Z', context: 'festa', match: 99 },
    ]
    const [entry] = buildMoodeHistory(history, feedback, [watch])
    expect(entry.context).toBeNull()
    expect(entry.score).toBeNull()
  })
})
