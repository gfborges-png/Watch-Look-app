import { describe, it, expect } from 'vitest'
import { pickBestSneakerForGarments } from './sneakerMatch.js'
import { LOOK_COLORS } from './matchEngine.js'

const hexFor = (id) => LOOK_COLORS.find((c) => c.id === id).hex

const tenisBranco = { id: 'branco', nome: 'Tênis Branco', tipo: 'Tênis', hexes: [hexFor('branco')] }
const tenisPreto = { id: 'preto', nome: 'Tênis Preto', tipo: 'Tênis', hexes: [hexFor('preto')] }
const sapatoSocialPreto = { id: 'social', nome: 'Sapato Social Preto', tipo: 'Sapato social', hexes: [hexFor('preto')] }

const camisaBranca = { key: 'camisa', label: 'Camisa', pronoun: 'sua', weight: 2.5, color: LOOK_COLORS.find((c) => c.id === 'branco') }
const calcaPreta = { key: 'calca', label: 'Calça', pronoun: 'sua', weight: 1.5, color: LOOK_COLORS.find((c) => c.id === 'preto') }

describe('pickBestSneakerForGarments', () => {
  it('sem tênis cadastrado, não sugere nada', () => {
    expect(pickBestSneakerForGarments([], [camisaBranca])).toBeNull()
  })

  it('sem nenhuma peça colorida, ainda assim escolhe algum tênis (score neutro)', () => {
    const best = pickBestSneakerForGarments([tenisBranco, tenisPreto], [])
    expect(best).not.toBeNull()
  })

  it('prefere o tênis que cria eco cromático com as outras peças', () => {
    const best = pickBestSneakerForGarments([tenisBranco, tenisPreto], [calcaPreta])
    expect(best.id).toBe('preto')
  })

  it('pra reunião importante, prefere sapato social ao tênis mesmo com cor pior', () => {
    const best = pickBestSneakerForGarments([tenisBranco, sapatoSocialPreto], [camisaBranca], 'reuniaoImportante')
    expect(best.id).toBe('social')
  })

  it('pro treino, prefere o tênis de verdade mesmo quando um sapato social também está cadastrado', () => {
    const best = pickBestSneakerForGarments([sapatoSocialPreto, tenisPreto], [calcaPreta], 'treino')
    expect(best.id).toBe('preto')
  })
})
