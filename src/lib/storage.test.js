import { describe, it, expect, beforeEach } from 'vitest'
import {
  personalBias,
  daysSince,
  lastWornDate,
  exportData,
  importData,
  getCollection,
  getFavoriteLooks,
  isFavoriteLook,
  toggleFavoriteLook,
  addPerfumes,
  getPerfumes,
  addSneaker,
  getSneakers,
  getAccessories,
  addAccessory,
  updateAccessory,
  deleteAccessory,
} from './storage.js'

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

describe('Moodes Favoritos (favoriteLooks)', () => {
  beforeEach(() => localStorage.clear())

  it('favorita um Moode (relógio+data), e desfavorita ao chamar de novo (toggle)', () => {
    const entry = { watchId: 'w1', date: '2026-09-08', context: 'trabalho', score: 87 }
    expect(isFavoriteLook('w1', '2026-09-08')).toBe(false)

    toggleFavoriteLook(entry)
    expect(isFavoriteLook('w1', '2026-09-08')).toBe(true)
    expect(getFavoriteLooks()).toHaveLength(1)

    toggleFavoriteLook(entry)
    expect(isFavoriteLook('w1', '2026-09-08')).toBe(false)
    expect(getFavoriteLooks()).toHaveLength(0)
  })

  it('favoritar o mesmo relógio em dias diferentes cria entradas separadas', () => {
    toggleFavoriteLook({ watchId: 'w1', date: '2026-09-08', context: 'trabalho', score: 87 })
    toggleFavoriteLook({ watchId: 'w1', date: '2026-09-09', context: 'casual', score: 80 })
    expect(getFavoriteLooks()).toHaveLength(2)
  })

  it('entra e sai do backup (exportData/importData)', () => {
    toggleFavoriteLook({ watchId: 'w1', date: '2026-09-08', context: 'trabalho', score: 87 })
    const data = exportData()
    expect(data.favoriteLooks).toHaveLength(1)

    localStorage.clear()
    importData(data)
    expect(getFavoriteLooks()).toHaveLength(1)
    expect(isFavoriteLook('w1', '2026-09-08')).toBe(true)
  })
})

describe('Perfumes (CRUD + acervo demo)', () => {
  beforeEach(() => localStorage.clear())

  it('começa com o acervo de demonstração (uma família por perfil de ocasião), sem precisar cadastrar nada', () => {
    expect(getPerfumes().length).toBeGreaterThanOrEqual(8)
  })
})

describe('addPerfumes — importação em lote', () => {
  beforeEach(() => localStorage.clear())

  it('acrescenta vários perfumes de uma vez, sem apagar os que já existiam (demo + importados)', () => {
    const before = getPerfumes().length
    addPerfumes([{ nome: 'Já tinha', marca: '', familia: 'Aromático limpo', notas: '' }])
    expect(getPerfumes()).toHaveLength(before + 1)

    addPerfumes([
      { nome: 'Bleu de Chanel', marca: 'Chanel', familia: 'Aromático limpo', notas: '' },
      { nome: 'Sauvage', marca: 'Dior', familia: 'Aromático limpo', notas: '' },
    ])
    expect(getPerfumes()).toHaveLength(before + 3)
  })

  it('preserva o campo notas de cada perfume importado', () => {
    addPerfumes([{ nome: 'Bleu de Chanel', marca: 'Chanel', familia: 'Aromático limpo', notas: 'vetiver, cedro, âmbar seco' }])
    const importado = getPerfumes().find((p) => p.nome === 'Bleu de Chanel')
    expect(importado.notas).toBe('vetiver, cedro, âmbar seco')
  })

  it('gera ids únicos mesmo quando dois nomes do lote colidem (slug igual)', () => {
    const antes = new Set(getPerfumes().map((p) => p.id))
    addPerfumes([
      { nome: 'Bleu de Chanel', marca: 'Chanel EDT', familia: 'Aromático limpo', notas: '' },
      { nome: 'Bleu de Chanel', marca: 'Chanel EDP', familia: 'Aromático limpo', notas: '' },
    ])
    const novosIds = getPerfumes().map((p) => p.id).filter((id) => !antes.has(id))
    expect(new Set(novosIds).size).toBe(2)
  })
})

describe('Tênis (CRUD + acervo demo)', () => {
  beforeEach(() => localStorage.clear())

  it('começa com o acervo de demonstração (cobrindo os 4 tipos de calçado), sem precisar cadastrar nada', () => {
    const tipos = new Set(getSneakers().map((s) => s.tipo))
    expect(getSneakers().length).toBeGreaterThanOrEqual(6)
    expect(tipos).toEqual(new Set(['Tênis', 'Sapato social', 'Loafer', 'Bota']))
  })

  it('adicionar tênis acrescenta à lista (demo + novo), sem apagar os que já existiam', () => {
    const before = getSneakers().length
    addSneaker({ nome: 'Teste QA', marca: '', tipo: 'Tênis', hexes: ['#F5F3EE'] })
    expect(getSneakers()).toHaveLength(before + 1)
  })
})

describe('Acessórios (CRUD + acervo demo)', () => {
  beforeEach(() => localStorage.clear())

  it('começa com o acervo de demonstração (pelo menos 6 acessórios), sem precisar cadastrar nada', () => {
    expect(getAccessories().length).toBeGreaterThanOrEqual(6)
  })

  it('adicionar acessório acrescenta à lista (demo + novo), sem apagar os que já existiam', () => {
    const before = getAccessories().length
    addAccessory({ type: 'anel', name: 'Anel de prata', brand: '', primaryColor: '#8C8C8C', material: 'prata', style: ['minimalista'], watchCompatibility: 'yes', image: null })
    expect(getAccessories()).toHaveLength(before + 1)
  })

  it('id do acessório vem prefixado com "acc-" (evita colisão com id de relógio no array de favoritos compartilhado)', () => {
    const [novo] = addAccessory({ type: 'anel', name: 'Teste', brand: '', primaryColor: '#000', material: 'prata', style: [], watchCompatibility: 'neutral', image: null }).slice(-1)
    expect(novo.id.startsWith('acc-')).toBe(true)
  })

  it('atualizar e remover acessório funcionam pelo id, sem afetar os outros', () => {
    const list = addAccessory({ type: 'anel', name: 'Original', brand: '', primaryColor: '#000', material: 'prata', style: [], watchCompatibility: 'neutral', image: null })
    const novo = list.at(-1)
    const afterUpdate = updateAccessory(novo.id, { ...novo, name: 'Editado' })
    expect(afterUpdate.find((a) => a.id === novo.id).name).toBe('Editado')

    const afterDelete = deleteAccessory(novo.id)
    expect(afterDelete.find((a) => a.id === novo.id)).toBeUndefined()
  })
})

describe('backup versionado (export/import)', () => {
  beforeEach(() => localStorage.clear())

  it('exporta no formato v4, com tênis/perfumes/acessórios agrupados sob wardrobe', () => {
    const data = exportData()
    expect(data.version).toBe(4)
    expect(data.wardrobe).toHaveProperty('sneakers')
    expect(data.wardrobe).toHaveProperty('perfumes')
    expect(data.wardrobe).toHaveProperty('accessories')
    expect(data.wardrobe).toHaveProperty('items')
  })

  it('importa um backup v2/v3 válido sem lançar erro', () => {
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

  it('rejeita tênis sem id/nome em qualquer formato (wardrobe.sneakers ou raiz), sem alterar o estado atual (v3)', () => {
    const before = getCollection()
    expect(() =>
      importData({ collection: before, wardrobe: { sneakers: [{ nome: 'Sem id' }], perfumes: [] } }),
    ).toThrow(/tênis/)
    expect(() => importData({ collection: before, sneakers: [{ id: 's1' }], perfumes: [] })).toThrow(/tênis/)
    expect(getCollection()).toEqual(before)
  })

  it('rejeita perfume sem id/nome, sem alterar o estado atual (v3)', () => {
    const before = getCollection()
    expect(() =>
      importData({ collection: before, wardrobe: { sneakers: [], perfumes: [{ id: 'p1' }] } }),
    ).toThrow(/perfumes/)
    expect(getCollection()).toEqual(before)
  })

  it('importa acessórios (v4) e sobrevive ao roundtrip export/import', () => {
    addAccessory({ type: 'anel', name: 'Anel exportado', brand: '', primaryColor: '#000', material: 'prata', style: ['minimalista'], watchCompatibility: 'yes', image: null })
    const data = exportData()
    localStorage.clear()
    importData(data)
    expect(getAccessories().some((a) => a.name === 'Anel exportado')).toBe(true)
  })

  it('rejeita acessório sem id/tipo, sem alterar o estado atual', () => {
    const before = getCollection()
    expect(() =>
      importData({ collection: before, wardrobe: { sneakers: [], perfumes: [], accessories: [{ name: 'Sem id nem tipo' }] } }),
    ).toThrow(/acessório/)
    expect(getCollection()).toEqual(before)
  })

  it('backup antigo (v1-v3, sem campo accessories) não apaga o acervo de acessórios atual — só ignora o que não conhece', () => {
    const before = getAccessories()
    expect(() => importData({ collection: getCollection(), sneakers: [], perfumes: [] })).not.toThrow()
    expect(getAccessories()).toEqual(before)
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
