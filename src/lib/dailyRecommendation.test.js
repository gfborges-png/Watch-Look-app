import { describe, it, expect } from 'vitest'
import { pickAdjustedIndex, defaultOccasionForToday, greetingForNow, buildTodayCandidates } from './dailyRecommendation.js'
import { daysAgoStr } from './test-helpers.js'

// candidatos sintéticos — só precisam de `watch` (com estilo/cor válidos
// pra getWatchDimensions) e `match`, que é tudo que pickAdjustedIndex lê.
const candidatos = [
  { watch: { id: 'w-casual', nome: 'Casual', cor: 'neutro-branco', estilo: 'Esportivo casual mergulho', hexes: ['#fff'] }, match: 80 },
  { watch: { id: 'w-formal', nome: 'Formal', cor: 'neutro-preto', estilo: 'Dress clássico elegante', hexes: ['#000'] }, match: 78 },
  { watch: { id: 'w-bold', nome: 'Bold', cor: 'quente-dourado', estilo: 'Racing statement esportivo chamativo', hexes: ['#c9a227'] }, match: 75 },
]

describe('pickAdjustedIndex', () => {
  it('com 0 ou 1 candidato, mantém o índice atual (nada pra trocar)', () => {
    expect(pickAdjustedIndex([], 0, 'outra')).toBe(0)
    expect(pickAdjustedIndex([candidatos[0]], 0, 'casual')).toBe(0)
  })

  it("'outra' cicla pro próximo candidato da lista, voltando ao início no final", () => {
    expect(pickAdjustedIndex(candidatos, 0, 'outra')).toBe(1)
    expect(pickAdjustedIndex(candidatos, candidatos.length - 1, 'outra')).toBe(0)
  })

  it("'casual' escolhe, entre os outros, o de menor formalidade", () => {
    const idx = pickAdjustedIndex(candidatos, 1, 'casual') // parte do formal
    expect(candidatos[idx].watch.id).toBe('w-casual')
  })

  it("'sofisticado' escolhe, entre os outros, o de maior formalidade", () => {
    const idx = pickAdjustedIndex(candidatos, 0, 'sofisticado') // parte do casual
    expect(candidatos[idx].watch.id).toBe('w-formal')
  })

  it("'ousado' escolhe, entre os outros, o de maior statement level", () => {
    const idx = pickAdjustedIndex(candidatos, 0, 'ousado')
    expect(candidatos[idx].watch.id).toBe('w-bold')
  })

  it('sem nenhum candidato que satisfaça o eixo pedido, mantém o atual (nunca troca pra pior à toa)', () => {
    // partindo do mais ousado, não existe nenhum "mais ousado" que ele no pool
    const idx = pickAdjustedIndex(candidatos, 2, 'ousado')
    expect(idx).toBe(2)
  })

  it("'variar' prioriza o candidato com maior rotationScore (mais 'pedindo' pra ser usado)", () => {
    const history = [
      { watchId: 'w-formal', date: daysAgoStr(1) }, // usado ontem — baixa rotação
      { watchId: 'w-bold', date: daysAgoStr(90) }, // parado há 90 dias — alta rotação
    ]
    const idx = pickAdjustedIndex(candidatos, 0, 'variar', { history })
    expect(candidatos[idx].watch.id).toBe('w-bold')
  })
})

describe('defaultOccasionForToday / greetingForNow — sanidade', () => {
  it('retorna fimDeSemana no sábado/domingo e trabalho nos outros dias', () => {
    const sabado = new Date('2026-09-12T10:00:00') // sábado
    const terca = new Date('2026-09-08T10:00:00') // terça
    expect(defaultOccasionForToday(sabado)).toBe('fimDeSemana')
    expect(defaultOccasionForToday(terca)).toBe('trabalho')
  })

  it('saudação muda conforme a hora', () => {
    expect(greetingForNow(new Date('2026-01-01T08:00:00'))).toBe('Bom dia')
    expect(greetingForNow(new Date('2026-01-01T14:00:00'))).toBe('Boa tarde')
    expect(greetingForNow(new Date('2026-01-01T20:00:00'))).toBe('Boa noite')
  })
})

describe('buildTodayCandidates — o tênis escolhido respeita a ocasião (bug real reportado)', () => {
  const watch = { id: 'w1', nome: 'Relógio Neutro', cor: 'neutro', estilo: 'Dress clássico elegante', hexes: ['#1B1B1D'] }

  it('reunião importante prefere sapato social sobre tênis casual, mesmo quando o tênis bate mais na cor', () => {
    // Jordan tem a cor IDÊNTICA ao relógio (harmonia máxima) — antes desse
    // fix, pickOwnedSneakerForGroup só olhava cor e sempre escolhia ele.
    const sneakers = [
      { id: 's-jordan', nome: 'Air Jordan 1 High', tipo: 'Tênis', hexes: ['#1B1B1D'] },
      { id: 's-social', nome: 'Sapato social preto', tipo: 'Sapato social', hexes: ['#8C8C8C'] },
    ]
    const [candidate] = buildTodayCandidates([watch], { contextId: 'reuniaoImportante', sneakers })
    expect(candidate.sneaker.id).toBe('s-social')
  })

  it('treino, ao contrário, prefere o tênis sobre o sapato social (mesma cor pros dois, só ocasião decide)', () => {
    const sneakers = [
      { id: 's-jordan', nome: 'Air Jordan 1 High', tipo: 'Tênis', hexes: ['#1B1B1D'] },
      { id: 's-social', nome: 'Sapato social preto', tipo: 'Sapato social', hexes: ['#1B1B1D'] },
    ]
    const [candidate] = buildTodayCandidates([watch], { contextId: 'treino', sneakers })
    expect(candidate.sneaker.id).toBe('s-jordan')
  })

  it('sem tênis cadastrado, não quebra — sneaker fica null e o resto do candidato continua íntegro', () => {
    const [candidate] = buildTodayCandidates([watch], { contextId: 'trabalho', sneakers: [] })
    expect(candidate.sneaker).toBeNull()
    expect(candidate.watch.id).toBe('w1')
  })
})
