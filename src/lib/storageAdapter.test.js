import { describe, it, expect, beforeEach, vi } from 'vitest'
import { installMemoryLocalStorage } from './test-helpers.js'

// Testa migrateLegacyKeys isoladamente, simulando o localStorage de um
// navegador que já tinha dado no formato antigo (sem profileId) — o
// cenário real de quem já usava o app antes dessa mudança. Reimporta o
// módulo a cada teste (vi.resetModules) porque a migração roda como
// efeito colateral no import, uma vez por "carregamento da página".
describe('migrateLegacyKeys', () => {
  beforeEach(() => {
    installMemoryLocalStorage()
    vi.resetModules()
  })

  it('copia dado legado (sem profileId) pra debaixo do perfil local, sem apagar o original', async () => {
    localStorage.setItem('watchlook:collection', JSON.stringify([{ id: 'w1', nome: 'Relógio Teste' }]))
    localStorage.setItem('watchlook:favorites', JSON.stringify(['w1']))
    localStorage.setItem('watchlook:sneakers', JSON.stringify([{ id: 's1', nome: 'Tênis Teste' }]))

    const { storageAdapter, DEFAULT_PROFILE_ID } = await import('./storageAdapter.js')

    expect(storageAdapter.profileId).toBe(DEFAULT_PROFILE_ID)
    expect(storageAdapter.get('collection')).toEqual([{ id: 'w1', nome: 'Relógio Teste' }])
    expect(storageAdapter.get('favorites')).toEqual(['w1'])
    expect(storageAdapter.get('sneakers')).toEqual([{ id: 's1', nome: 'Tênis Teste' }])
    // dado antigo continua lá, intocado
    expect(JSON.parse(localStorage.getItem('watchlook:collection'))).toEqual([{ id: 'w1', nome: 'Relógio Teste' }])
  })

  it('é idempotente — rodar de novo não duplica nem sobrescreve dado já migrado/editado', async () => {
    localStorage.setItem('watchlook:collection', JSON.stringify([{ id: 'w1', nome: 'Original' }]))
    const mod1 = await import('./storageAdapter.js')
    mod1.storageAdapter.set('collection', [{ id: 'w1', nome: 'Editado depois da migração' }])

    vi.resetModules()
    const mod2 = await import('./storageAdapter.js')
    mod2.migrateLegacyKeys() // simula rodar de novo, ex: novo reload

    expect(mod2.storageAdapter.get('collection')).toEqual([{ id: 'w1', nome: 'Editado depois da migração' }])
  })

  it('sem dado legado nenhum (instalação nova), não quebra e não cria nada', async () => {
    const { storageAdapter } = await import('./storageAdapter.js')
    expect(storageAdapter.get('collection', 'fallback')).toBe('fallback')
    expect(storageAdapter.get('sneakers', [])).toEqual([])
  })
})
