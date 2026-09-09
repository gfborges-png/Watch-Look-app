import { describe, it, expect } from 'vitest'
import { pickBestSneakerForGarments, scoreSneakersForLook } from './sneakerMatch.js'
import { LOOK_COLORS } from './matchEngine.js'

const hexFor = (id) => LOOK_COLORS.find((c) => c.id === id).hex

const tenisBranco = { id: 'branco', nome: 'Tênis Branco', tipo: 'Tênis', hexes: [hexFor('branco')] }
const tenisPreto = { id: 'preto', nome: 'Tênis Preto', tipo: 'Tênis', hexes: [hexFor('preto')] }
const sapatoSocialPreto = { id: 'social', nome: 'Sapato Social Preto', tipo: 'Sapato social', hexes: [hexFor('preto')] }
const botaMarrom = { id: 'bota', nome: 'Bota Marrom', tipo: 'Bota', hexes: [hexFor('marrom')] }

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

describe('scoreSneakersForLook — SneakerScore explicável', () => {
  it('score é absoluto 0-100, não relativo ao melhor da rodada', () => {
    const [top] = scoreSneakersForLook([tenisPreto], { coloredGarments: [calcaPreta], contextId: 'trabalho' })
    expect(top.match).toBeGreaterThan(0)
    expect(top.match).toBeLessThan(100)
  })

  it('sem clima/preferência informados, esses sub-scores ficam null (nunca inventados)', () => {
    const [top] = scoreSneakersForLook([tenisPreto], { coloredGarments: [calcaPreta], contextId: 'trabalho' })
    expect(top.subScores.clima).toBeNull()
    expect(top.subScores.preferencia).toBeNull()
    expect(top.subScores.harmonia).not.toBeNull()
    expect(top.subScores.ocasiao).not.toBeNull()
  })

  it('informando clima e preferência, os sub-scores correspondentes deixam de ser null', () => {
    const [top] = scoreSneakersForLook([tenisPreto], {
      coloredGarments: [calcaPreta],
      contextId: 'trabalho',
      weatherBias: 'quente',
      personalBias: { neutro: 1 },
    })
    expect(top.subScores.clima).not.toBeNull()
    expect(top.subScores.preferencia).not.toBeNull()
  })

  it('dia quente favorece tênis respirável sobre bota; dia frio inverte', () => {
    const quente = scoreSneakersForLook([tenisPreto, botaMarrom], { weatherBias: 'quente' })
    expect(quente.find((r) => r.sneaker.id === 'preto').match).toBeGreaterThan(quente.find((r) => r.sneaker.id === 'bota').match)

    const frio = scoreSneakersForLook([tenisPreto, botaMarrom], { weatherBias: 'frio' })
    expect(frio.find((r) => r.sneaker.id === 'bota').match).toBeGreaterThan(frio.find((r) => r.sneaker.id === 'preto').match)
  })

  it('resultados vêm ordenados do maior pro menor match', () => {
    const results = scoreSneakersForLook([tenisBranco, tenisPreto, sapatoSocialPreto, botaMarrom], {
      coloredGarments: [calcaPreta],
      contextId: 'casual',
    })
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].match).toBeGreaterThanOrEqual(results[i].match)
    }
  })

  it('vibeId "relaxado" reduz o sub-score de ocasião do sapato social pro trabalho (perfil-alvo menos formal)', () => {
    const semVibe = scoreSneakersForLook([sapatoSocialPreto], { coloredGarments: [calcaPreta], contextId: 'trabalho' })[0]
    const relaxado = scoreSneakersForLook([sapatoSocialPreto], { coloredGarments: [calcaPreta], contextId: 'trabalho', vibeId: 'relaxado' })[0]
    expect(relaxado.subScores.ocasiao).toBeLessThan(semVibe.subScores.ocasiao)
  })
})
