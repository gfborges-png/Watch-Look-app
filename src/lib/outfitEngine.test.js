import { describe, it, expect } from 'vitest'
import { generateLooks, lookForOccasion, paletteGroup, SNEAKER_REFERENCES } from './outfitEngine.js'
import { CONTEXTS } from './matchEngine.js'

const relogioQuente = { nome: 'Teste', cor: 'quente', estilo: 'Dress clássico elegante', hexes: ['#c9a227'] }

// Palavras que só fazem sentido em looks formais/de escritório — nunca
// deveriam aparecer numa sugestão de Treino, por mais que a cor combine
// com o mostrador.
const PALAVRAS_FORMAIS = ['linho', 'social', 'alfaiataria', 'blazer', 'sapato']

describe('lookForOccasion', () => {
  it('cobre as 8 ocasiões de matchEngine.CONTEXTS, todas com peças definidas', () => {
    for (const ctx of CONTEXTS) {
      const look = lookForOccasion(relogioQuente, ctx.id)
      expect(look.top, `ocasião "${ctx.id}" sem top`).toBeTruthy()
      expect(look.bottom, `ocasião "${ctx.id}" sem bottom`).toBeTruthy()
      expect(look.tenis, `ocasião "${ctx.id}" sem tênis/calçado`).toBeTruthy()
    }
  })

  it('Treino nunca sugere peça formal (bug real: caía no fallback de Trabalho e sugeria "Camisa de linho")', () => {
    const look = lookForOccasion(relogioQuente, 'treino')
    const textoCompleto = `${look.top} ${look.bottom} ${look.tenis} ${look.camadaExtra ?? ''}`.toLowerCase()
    for (const palavra of PALAVRAS_FORMAIS) {
      expect(textoCompleto, `look de treino não deveria conter "${palavra}": ${textoCompleto}`).not.toContain(palavra)
    }
    expect(look.tenis.toLowerCase()).toContain('treino')
  })

  it('Reunião importante, Jantar romântico e Casamento sempre vão de sapato (nunca tênis)', () => {
    for (const ctx of ['reuniaoImportante', 'jantarRomantico', 'casamento']) {
      const look = lookForOccasion(relogioQuente, ctx)
      expect(look.tenis.toLowerCase()).not.toContain('tênis')
    }
  })

  it("Trabalho/Casual/Fim de semana delegam pro mesmo look de generateLooks (sem duplicar a lógica curada)", () => {
    const looks = generateLooks(relogioQuente)
    expect(lookForOccasion(relogioQuente, 'trabalho')).toEqual(looks[0])
    expect(lookForOccasion(relogioQuente, 'casual')).toEqual(looks[1])
    expect(lookForOccasion(relogioQuente, 'fimDeSemana')).toEqual(looks[2])
  })

  it('cada ocasião usa cores da paleta do mostrador (o "porque" cita a paleta certa)', () => {
    const grupo = paletteGroup(relogioQuente.cor)
    expect(grupo).toBe('quente')
    const look = lookForOccasion(relogioQuente, 'reuniaoImportante')
    expect(look.porque.toLowerCase()).toContain('quente')
  })
})

describe('SNEAKER_REFERENCES — "outras opções" que a pessoa não tem, sempre ao lado do que ela já possui', () => {
  it('toda paleta (quente/frio/terroso/neutro) tem pelo menos uma referência', () => {
    for (const grupo of ['quente', 'frio', 'terroso', 'neutro']) {
      expect(SNEAKER_REFERENCES[grupo]?.length, `paleta "${grupo}" sem referências`).toBeGreaterThan(0)
    }
  })
})
