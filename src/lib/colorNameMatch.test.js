import { describe, it, expect } from 'vitest'
import { matchColorNameToHexes, guessBrand } from './colorNameMatch.js'
import { LOOK_COLORS } from './matchEngine.js'

const hexFor = (id) => LOOK_COLORS.find((c) => c.id === id).hex

describe('matchColorNameToHexes', () => {
  it('reconhece formas femininas dos adjetivos de cor (não só masculinas)', () => {
    expect(matchColorNameToHexes('Camisa branca', 1)).toEqual([hexFor('branco')])
    expect(matchColorNameToHexes('Calça preta', 1)).toEqual([hexFor('preto')])
  })

  it('reconhece compostos hifenizados (cinza-chumbo, azul-marinho)', () => {
    expect(matchColorNameToHexes('Calça cinza-chumbo', 1)).toEqual([hexFor('cinza')])
    expect(matchColorNameToHexes('Blazer azul-marinho', 1)).toEqual([hexFor('marinho')])
  })

  it('sem nenhuma cor reconhecível, cai num cinza neutro em vez de retornar vazio', () => {
    expect(matchColorNameToHexes('Xyzabc', 1)).toEqual([hexFor('cinza')])
  })

  it('jargão de colorway em inglês (sneaker) continua funcionando', () => {
    expect(matchColorNameToHexes('Off-White/Marrom/Gum', 2)).toEqual([hexFor('bege'), hexFor('marrom')])
  })
})

describe('guessBrand', () => {
  it('reconhece marcas comuns a partir do nome', () => {
    expect(guessBrand('Air Jordan 1 High')).toBe('Jordan')
    expect(guessBrand('Nike Dunk Low')).toBe('Nike')
  })

  it('sem marca reconhecida, fica em branco', () => {
    expect(guessBrand('Modelo genérico qualquer')).toBe('')
  })
})
