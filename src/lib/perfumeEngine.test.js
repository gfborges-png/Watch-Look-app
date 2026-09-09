import { describe, it, expect } from 'vitest'
import { suggestPerfume, rankOwnedPerfumes, KNOWN_FAMILIES, matchFamilyName } from './perfumeEngine.js'
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

  it('com dois perfumes da mesma família, `owned` vem ordenado pelas notas mais adequadas ao clima de hoje', () => {
    const p = suggestPerfume({
      weatherBias: 'quente',
      context: 'trabalho',
      ownedPerfumes: [
        { id: 'p1', nome: 'Denso', familia: 'Aromático limpo', notas: 'âmbar, baunilha, couro' },
        { id: 'p2', nome: 'Fresco', familia: 'Aromático limpo', notas: 'bergamota, limão, notas aquáticas' },
      ],
    })
    expect(p.owned[0].nome).toBe('Fresco')
    expect(p.owned[1].nome).toBe('Denso')
  })
})

describe('rankOwnedPerfumes — FragranceScore explicável', () => {
  it('perfume da família nativa da ocasião pontua o máximo', () => {
    const [top] = rankOwnedPerfumes([{ id: 'p1', nome: 'Trabalho', familia: 'Aromático limpo' }], { contextId: 'trabalho' })
    expect(top.match).toBe(100)
    expect(top.subScores.ocasiao).toBe(100)
  })

  it('perfume de outra família ainda pontua algo (nunca zero por padrão), proporcional à distância entre ocasiões', () => {
    const [festa] = rankOwnedPerfumes([{ id: 'p1', nome: 'Festa', familia: 'Amadeirado-doce statement' }], { contextId: 'trabalho' })
    const [treino] = rankOwnedPerfumes([{ id: 'p1', nome: 'Treino', familia: 'Cítrico esportivo' }], { contextId: 'trabalho' })
    // festa (formal, statement alto) está mais longe do trabalho do que
    // um perfume esportivo leve pensado pro dia a dia ativo.
    expect(festa.match).toBeLessThan(100)
    expect(treino.match).toBeLessThan(100)
  })

  it('sem contexto nem clima, os dois sub-scores ficam null mas ainda retorna um score', () => {
    const [top] = rankOwnedPerfumes([{ id: 'p1', nome: 'X', familia: 'Aromático limpo' }])
    expect(top.subScores.ocasiao).toBeNull()
    expect(top.subScores.clima).toBeNull()
    expect(top.match).toBeGreaterThan(0)
  })

  it('clima informado acrescenta um sub-score e favorece a família mais adequada ao calor', () => {
    const quente = rankOwnedPerfumes(
      [
        { id: 'p1', nome: 'Cítrico', familia: 'Cítrico esportivo' },
        { id: 'p2', nome: 'Sensual', familia: 'Amadeirado sensual' },
      ],
      { weatherBias: 'quente' },
    )
    expect(quente.find((r) => r.perfume.id === 'p1').match).toBeGreaterThan(quente.find((r) => r.perfume.id === 'p2').match)
  })

  it('resultados vêm ordenados do maior pro menor match', () => {
    const results = rankOwnedPerfumes(
      [
        { id: 'p1', nome: 'A', familia: 'Aromático limpo' },
        { id: 'p2', nome: 'B', familia: 'Amadeirado-doce statement' },
        { id: 'p3', nome: 'C', familia: 'Cítrico esportivo' },
      ],
      { contextId: 'trabalho' },
    )
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].match).toBeGreaterThanOrEqual(results[i].match)
    }
  })
})

describe('notas refinando o sub-score de clima (rankOwnedPerfumes)', () => {
  it('notas frescas/cítricas pontuam mais alto que notas densas/amadeiradas num dia quente, mesma família', () => {
    const results = rankOwnedPerfumes(
      [
        { id: 'p1', nome: 'Denso', familia: 'Aromático limpo', notas: 'âmbar, baunilha, couro' },
        { id: 'p2', nome: 'Fresco', familia: 'Aromático limpo', notas: 'bergamota, limão, notas aquáticas' },
      ],
      { weatherBias: 'quente' },
    )
    const fresco = results.find((r) => r.perfume.nome === 'Fresco')
    const denso = results.find((r) => r.perfume.nome === 'Denso')
    expect(fresco.match).toBeGreaterThan(denso.match)
  })

  it('a mesma nota inverte a preferência no frio (o denso passa a pontuar mais)', () => {
    const notasFrescas = { id: 'p1', nome: 'Fresco', familia: 'Aromático limpo', notas: 'bergamota, limão' }
    const notasDensas = { id: 'p2', nome: 'Denso', familia: 'Aromático limpo', notas: 'âmbar, baunilha' }
    const [frescoNoFrio] = rankOwnedPerfumes([notasFrescas], { weatherBias: 'frio' })
    const [densoNoFrio] = rankOwnedPerfumes([notasDensas], { weatherBias: 'frio' })
    expect(densoNoFrio.match).toBeGreaterThan(frescoNoFrio.match)
  })

  it('sem notas reconhecidas, cai no valor da família (mesmo comportamento de antes, sem regressão)', () => {
    const semNotas = rankOwnedPerfumes([{ id: 'p1', nome: 'X', familia: 'Aromático limpo' }], { weatherBias: 'quente' })[0]
    const notaIrreconhecivel = rankOwnedPerfumes(
      [{ id: 'p1', nome: 'X', familia: 'Aromático limpo', notas: 'algo bem genérico' }],
      { weatherBias: 'quente' },
    )[0]
    expect(notaIrreconhecivel.match).toBe(semNotas.match)
  })
})

describe('matchFamilyName — importação em lote de perfumes', () => {
  it('bate uma família conhecida ignorando maiúscula/acento', () => {
    expect(matchFamilyName(KNOWN_FAMILIES[0].toUpperCase())).toBe(KNOWN_FAMILIES[0])
  })

  it('sem texto ou sem família reconhecida, devolve null (não chuta uma família parecida)', () => {
    expect(matchFamilyName(null)).toBeNull()
    expect(matchFamilyName(undefined)).toBeNull()
    expect(matchFamilyName('')).toBeNull()
    expect(matchFamilyName('Família que não existe')).toBeNull()
  })
})
