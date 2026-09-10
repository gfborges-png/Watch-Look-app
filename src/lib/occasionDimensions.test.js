import { describe, it, expect } from 'vitest'
import { OCCASION_DIMENSIONS, VIBES, occasionProfileWithVibe, occasionDistance } from './occasionDimensions.js'

describe('VIBES', () => {
  it('toda vibe tem id, label e os dois deslocamentos', () => {
    for (const v of VIBES) {
      expect(v.id).toBeTruthy()
      expect(v.label).toBeTruthy()
      expect(typeof v.formalityShift).toBe('number')
      expect(typeof v.statementShift).toBe('number')
    }
  })
})

describe('occasionProfileWithVibe', () => {
  it('sem vibe, devolve o perfil original da ocasião sem alterar nada', () => {
    expect(occasionProfileWithVibe('trabalho', null)).toEqual(OCCASION_DIMENSIONS.trabalho)
  })

  it('ocasião inexistente devolve null mesmo com vibe', () => {
    expect(occasionProfileWithVibe('nao-existe', 'elegante')).toBeNull()
  })

  it('vibe desconhecida não quebra — devolve o perfil original', () => {
    expect(occasionProfileWithVibe('trabalho', 'vibe-que-nao-existe')).toEqual(OCCASION_DIMENSIONS.trabalho)
  })

  it('"relaxado" reduz formalidade em relação à ocasião pura', () => {
    const base = OCCASION_DIMENSIONS.trabalho
    const relaxado = occasionProfileWithVibe('trabalho', 'relaxado')
    expect(relaxado.formality).toBeLessThan(base.formality)
  })

  it('"sofisticado" aumenta formalidade em relação à ocasião pura', () => {
    const base = OCCASION_DIMENSIONS.casual
    const sofisticado = occasionProfileWithVibe('casual', 'sofisticado')
    expect(sofisticado.formality).toBeGreaterThan(base.formality)
  })

  it('nunca sai da faixa 0-100, mesmo em ocasiões já no extremo', () => {
    const marcanteNoTreino = occasionProfileWithVibe('treino', 'marcante')
    expect(marcanteNoTreino.formality).toBeGreaterThanOrEqual(0)
    expect(marcanteNoTreino.formality).toBeLessThanOrEqual(100)
    expect(marcanteNoTreino.statement).toBeGreaterThanOrEqual(0)
    expect(marcanteNoTreino.statement).toBeLessThanOrEqual(100)

    const relaxadoNaReuniao = occasionProfileWithVibe('reuniaoImportante', 'relaxado')
    expect(relaxadoNaReuniao.formality).toBeGreaterThanOrEqual(0)
  })

  it('sportiness não muda por vibe — só formalidade e statement são ajustáveis por "como você quer se sentir"', () => {
    const base = OCCASION_DIMENSIONS.fimDeSemana
    const confiante = occasionProfileWithVibe('fimDeSemana', 'confiante')
    expect(confiante.sportiness).toBe(base.sportiness)
  })
})

describe('occasionDistance segue funcionando sem vibe (nenhuma regressão)', () => {
  it('mesma ocasião tem distância zero', () => {
    expect(occasionDistance('trabalho', 'trabalho')).toBe(0)
  })
})
