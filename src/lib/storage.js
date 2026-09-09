// Regras de negócio de persistência (CRUD de coleção, guarda-roupa,
// histórico, escolhas, feedback). Fala só com storageAdapter.js — nunca
// toca localStorage/db.js diretamente — pra manter a porta aberta pra
// uma futura RemoteStorageAdapter sem reescrever nada daqui.
import { watches as defaultWatches } from '../data/watches.js'
import { storageAdapter } from './storageAdapter.js'

const HISTORY_LIMIT = 200
const CHOICES_LIMIT = 150
const FEEDBACK_LIMIT = 300
const BASE_GROUPS = ['quente', 'frio', 'terroso', 'neutro']

// Coleção: começa como os 23 relógios padrão, mas qualquer edição
// (adicionar/editar/remover) passa a persistir a lista inteira do usuário.
export function getCollection() {
  return storageAdapter.get('collection', null) ?? defaultWatches
}

function saveCollection(collection) {
  storageAdapter.set('collection', collection)
  return collection
}

export function resetCollection() {
  storageAdapter.remove('collection')
  return defaultWatches
}

function slugify(text) {
  const slug = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return slug || 'relogio'
}

function makeItemId(nome, existingIds) {
  const base = slugify(nome)
  let id = base
  let n = 2
  while (existingIds.includes(id)) {
    id = `${base}-${n}`
    n++
  }
  return id
}

export function addWatch(watchData) {
  const collection = getCollection()
  const id = makeItemId(watchData.nome, collection.map((w) => w.id))
  return saveCollection([...collection, { ...watchData, id }])
}

export function updateWatch(id, watchData) {
  const collection = getCollection()
  return saveCollection(collection.map((w) => (w.id === id ? { ...watchData, id } : w)))
}

export function deleteWatch(id) {
  const collection = getCollection()
  return saveCollection(collection.filter((w) => w.id !== id))
}

// Tênis e perfumes cadastrados — catálogos simples do que você já tem,
// pra sugestão poder apontar pras suas próprias coisas em vez de só um
// tipo genérico ("tênis branco") ou uma referência de mercado.
export function getSneakers() {
  return storageAdapter.get('sneakers', [])
}

function saveSneakers(list) {
  storageAdapter.set('sneakers', list)
  return list
}

export function addSneaker(data) {
  const list = getSneakers()
  const id = makeItemId(data.nome, list.map((s) => s.id))
  return saveSneakers([...list, { ...data, id }])
}

export function updateSneaker(id, data) {
  const list = getSneakers()
  return saveSneakers(list.map((s) => (s.id === id ? { ...data, id } : s)))
}

export function deleteSneaker(id) {
  const list = getSneakers()
  return saveSneakers(list.filter((s) => s.id !== id))
}

// Adiciona vários tênis de uma vez (importação em lote) — só acrescenta
// à lista existente, nunca substitui; o resto do storage não é tocado.
export function addSneakers(dataList) {
  const list = getSneakers()
  const added = []
  for (const data of dataList) {
    const id = makeItemId(data.nome, [...list, ...added].map((s) => s.id))
    added.push({ ...data, id })
  }
  return saveSneakers([...list, ...added])
}

export function getPerfumes() {
  return storageAdapter.get('perfumes', [])
}

function savePerfumes(list) {
  storageAdapter.set('perfumes', list)
  return list
}

export function addPerfume(data) {
  const list = getPerfumes()
  const id = makeItemId(data.nome, list.map((p) => p.id))
  return savePerfumes([...list, { ...data, id }])
}

export function updatePerfume(id, data) {
  const list = getPerfumes()
  return savePerfumes(list.map((p) => (p.id === id ? { ...data, id } : p)))
}

export function deletePerfume(id) {
  const list = getPerfumes()
  return savePerfumes(list.filter((p) => p.id !== id))
}

// Item genérico de guarda-roupa — categorias além de relógio/tênis/
// perfume (camisa, calça, jaqueta, óculos, acessório...). Relógio/tênis/
// perfume continuam em suas próprias coleções dedicadas (não vale a
// pena migrar dado real do usuário só por uniformidade), mas qualquer
// categoria nova entra por aqui em vez de precisar de mais uma tabela.
// Forma (ver docs/wardrobeItem.md): id, ownerId, category, subcategory,
// brand, model, name, colors, materials, style, formality, seasonality,
// weatherSuitability, occasions, image, favorite, createdAt, updatedAt,
// lastUsedAt, usageCount, attributes.
export function getWardrobeItems() {
  return storageAdapter.get('wardrobeItems', [])
}

function saveWardrobeItems(list) {
  storageAdapter.set('wardrobeItems', list)
  return list
}

export function addWardrobeItem(data) {
  const list = getWardrobeItems()
  const id = makeItemId(data.name || data.model || data.category, list.map((i) => i.id))
  const now = new Date().toISOString()
  const item = {
    ownerId: storageAdapter.profileId,
    favorite: false,
    colors: [],
    image: null,
    lastUsedAt: null,
    usageCount: 0,
    attributes: {},
    ...data,
    id,
    createdAt: now,
    updatedAt: now,
  }
  return saveWardrobeItems([...list, item])
}

export function updateWardrobeItem(id, data) {
  const list = getWardrobeItems()
  return saveWardrobeItems(list.map((i) => (i.id === id ? { ...i, ...data, id, updatedAt: new Date().toISOString() } : i)))
}

export function deleteWardrobeItem(id) {
  const list = getWardrobeItems()
  return saveWardrobeItems(list.filter((i) => i.id !== id))
}

// Feedback pós-recomendação (👍 boa sugestão / ❤️ ficou perfeito / 👎 não
// usaria, com motivo opcional) — sinal mais direto que "escolhi outro
// relógio" (choices): aqui a pessoa está avaliando a sugestão em si, não
// só registrando o que vestiu. Alimenta o personalBias / UserStyleProfile.
export function getFeedback() {
  return storageAdapter.get('feedback', [])
}

export function logFeedback(entry) {
  const list = getFeedback()
  const id = `fb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  const next = [{ ...entry, id, date: new Date().toISOString() }, ...list].slice(0, FEEDBACK_LIMIT)
  storageAdapter.set('feedback', next)
  return next
}

// Backup: um único JSON com tudo — coleção, favoritos, histórico,
// escolhas, feedback e guarda-roupa — pra não perder nada se limpar os
// dados do navegador ou trocar de aparelho.
//
// v2 agrupa tênis/perfumes/itens genéricos sob `wardrobe` e adiciona
// `feedback`; v1 (formato antigo, ainda pode estar em backups já
// baixados) tinha `sneakers`/`perfumes` soltos no nível raiz. A leitura
// aceita os dois formatos — ver normalizeBackup.
const BACKUP_VERSION = 2

export function exportData() {
  return {
    app: 'watch-look',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    collection: getCollection(),
    favorites: getFavorites(),
    favoriteLooks: getFavoriteLooks(),
    history: getHistory(),
    choices: getChoices(),
    feedback: getFeedback(),
    wardrobe: {
      sneakers: getSneakers(),
      perfumes: getPerfumes(),
      items: getWardrobeItems(),
    },
  }
}

// Aceita qualquer versão de backup já emitida por este app e devolve um
// objeto no formato interno canônico (v2), pronto pra aplicar. Nunca
// lança por causa de campo ausente — cada coleção vira [] se não existir.
function normalizeBackup(data) {
  const wardrobe = data.wardrobe && typeof data.wardrobe === 'object' ? data.wardrobe : null
  return {
    collection: Array.isArray(data.collection) ? data.collection : [],
    favorites: Array.isArray(data.favorites) ? data.favorites : [],
    favoriteLooks: Array.isArray(data.favoriteLooks) ? data.favoriteLooks : [],
    history: Array.isArray(data.history) ? data.history : [],
    choices: Array.isArray(data.choices) ? data.choices : [],
    feedback: Array.isArray(data.feedback) ? data.feedback : [],
    sneakers: Array.isArray(wardrobe?.sneakers) ? wardrobe.sneakers : Array.isArray(data.sneakers) ? data.sneakers : [],
    perfumes: Array.isArray(wardrobe?.perfumes) ? wardrobe.perfumes : Array.isArray(data.perfumes) ? data.perfumes : [],
    wardrobeItems: Array.isArray(wardrobe?.items) ? wardrobe.items : [],
  }
}

// Validação mínima antes de tocar em qualquer storage — um JSON qualquer
// (ou um backup de outro app) não pode corromper o estado atual.
function validateBackup(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Arquivo inválido: não é um JSON de backup.')
  }
  if (!Array.isArray(data.collection)) {
    throw new Error('Arquivo inválido: não parece um backup do MOODE (sem coleção de relógios).')
  }
  for (const w of data.collection) {
    if (!w || typeof w !== 'object' || typeof w.id !== 'string' || typeof w.nome !== 'string') {
      throw new Error('Arquivo inválido: um item da coleção está sem id/nome.')
    }
  }
}

export function importData(data) {
  validateBackup(data)
  const normalized = normalizeBackup(data)
  saveCollection(normalized.collection)
  storageAdapter.set('favorites', normalized.favorites)
  storageAdapter.set('favoriteLooks', normalized.favoriteLooks)
  storageAdapter.set('history', normalized.history)
  storageAdapter.set('choices', normalized.choices)
  storageAdapter.set('feedback', normalized.feedback)
  storageAdapter.set('sneakers', normalized.sneakers)
  storageAdapter.set('perfumes', normalized.perfumes)
  storageAdapter.set('wardrobeItems', normalized.wardrobeItems)
}

export function getFavorites() {
  return storageAdapter.get('favorites', [])
}

export function toggleFavorite(watchId) {
  const favorites = getFavorites()
  const next = favorites.includes(watchId) ? favorites.filter((id) => id !== watchId) : [...favorites, watchId]
  storageAdapter.set('favorites', next)
  return next
}

// "Moodes Favoritos" — favoritar o CONJUNTO usado num dia (relógio +
// ocasião + score), não só um item isolado (isso já existe acima, por
// watchId). Id estável watchId+data, então favoritar/desfavoritar a
// mesma entrada do histórico nunca duplica.
export function getFavoriteLooks() {
  return storageAdapter.get('favoriteLooks', [])
}

export function isFavoriteLook(watchId, date) {
  return getFavoriteLooks().some((f) => f.watchId === watchId && f.date === date)
}

export function toggleFavoriteLook({ watchId, date, context, score }) {
  const favorites = getFavoriteLooks()
  const exists = favorites.some((f) => f.watchId === watchId && f.date === date)
  const next = exists
    ? favorites.filter((f) => !(f.watchId === watchId && f.date === date))
    : [{ watchId, date, context, score, favoritedAt: new Date().toISOString() }, ...favorites]
  storageAdapter.set('favoriteLooks', next)
  return next
}

// Histórico: uma entrada por dia por relógio, mais recente primeiro.
export function getHistory() {
  return storageAdapter.get('history', [])
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export function logWornToday(watchId) {
  const today = todayStr()
  const history = getHistory().filter((h) => !(h.watchId === watchId && h.date === today))
  const next = [{ watchId, date: today }, ...history].slice(0, HISTORY_LIMIT)
  storageAdapter.set('history', next)
  return next
}

export function lastWornDate(watchId, history) {
  const entry = history.find((h) => h.watchId === watchId)
  return entry ? entry.date : null
}

// Diferença em dias de calendário (não em horas corridas) — comparar
// "hoje" com a hora atual faria a mesma data virar "ontem" à tarde.
function toUTCDateOnly(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

export function daysSince(dateStr) {
  if (!dateStr) return Infinity
  const diff = toUTCDateOnly(todayStr()) - toUTCDateOnly(dateStr)
  return Math.max(0, Math.round(diff / 86400000))
}

// Escolhas: toda vez que a pessoa diz "foi esse relógio que eu escolhi"
// (sugerido ou não), guardamos o grupo de paleta escolhido. É o que
// alimenta o `personalBias` — a "inteligência" aprendendo com o uso real,
// não só com a regra de cor.
export function getChoices() {
  return storageAdapter.get('choices', [])
}

export function logChoice(entry) {
  const choices = getChoices()
  const next = [{ ...entry, date: new Date().toISOString() }, ...choices].slice(0, CHOICES_LIMIT)
  storageAdapter.set('choices', next)
  return next
}

// Compara, nas últimas `sampleSize` escolhas + feedback, com que
// frequência (ponderada) cada grupo de paleta foi bem avaliado contra uma
// base uniforme (25% cada) — vira um pequeno bônus/penalidade de
// pontuação por grupo. Escolhas manuais (logChoice) valem 1 voto; feedback
// pós-sugestão (logFeedback) vale mais ou menos dependendo da reação:
// ❤️ ficou perfeito = +2, 👍 boa sugestão = +1, 👎 não usaria = -1.5 —
// sinal mais direto de gosto do que só "foi isso que eu escolhi". Só age
// depois de um mínimo de dados, senão qualquer avaliação isolada vira ruído.
const FEEDBACK_WEIGHT = { love: 2, like: 1, dislike: -1.5 }

export function personalBias(choices, feedback = [], sampleSize = 20) {
  const recentChoices = choices.slice(0, sampleSize)
  const recentFeedback = feedback.slice(0, sampleSize)
  if (recentChoices.length + recentFeedback.length < 4) return {}

  const weight = Object.fromEntries(BASE_GROUPS.map((g) => [g, 0]))
  let totalWeight = 0
  for (const c of recentChoices) {
    if (!(c.group in weight)) continue
    weight[c.group] += 1
    totalWeight += 1
  }
  for (const f of recentFeedback) {
    if (!(f.group in weight)) continue
    const w = FEEDBACK_WEIGHT[f.rating] ?? 0
    weight[f.group] += w
    totalWeight += Math.abs(w)
  }
  if (totalWeight === 0) return {}

  const bias = {}
  for (const g of BASE_GROUPS) {
    bias[g] = (weight[g] / totalWeight - 1 / BASE_GROUPS.length) * 4
  }
  return bias
}
