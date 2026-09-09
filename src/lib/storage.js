// Persistência local (coleção editável + favoritos + histórico de uso).
// Tudo fica só no navegador do usuário — não tem backend, então cada
// leitura/escrita é protegida contra localStorage indisponível (modo
// privado, etc) pela camada db.js.
import { watches as defaultWatches } from '../data/watches.js'
import { db } from './db.js'

const COLLECTION_KEY = 'watchlook:collection'
const FAVORITES_KEY = 'watchlook:favorites'
const HISTORY_KEY = 'watchlook:history'
const CHOICES_KEY = 'watchlook:choices'
const SNEAKERS_KEY = 'watchlook:sneakers'
const PERFUMES_KEY = 'watchlook:perfumes'
const WARDROBE_ITEMS_KEY = 'watchlook:wardrobeItems'
const FEEDBACK_KEY = 'watchlook:feedback'
const HISTORY_LIMIT = 200
const CHOICES_LIMIT = 150
const FEEDBACK_LIMIT = 300
const BASE_GROUPS = ['quente', 'frio', 'terroso', 'neutro']

const safeGet = db.get
const safeSet = db.set

// Coleção: começa como os 23 relógios padrão, mas qualquer edição
// (adicionar/editar/remover) passa a persistir a lista inteira do usuário.
export function getCollection() {
  return safeGet(COLLECTION_KEY, null) ?? defaultWatches
}

function saveCollection(collection) {
  safeSet(COLLECTION_KEY, collection)
  return collection
}

export function resetCollection() {
  db.remove(COLLECTION_KEY)
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
  return safeGet(SNEAKERS_KEY, [])
}

function saveSneakers(list) {
  safeSet(SNEAKERS_KEY, list)
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

export function getPerfumes() {
  return safeGet(PERFUMES_KEY, [])
}

function savePerfumes(list) {
  safeSet(PERFUMES_KEY, list)
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

// Item genérico de guarda-roupa — categorias futuras além de tênis e
// perfume (camisa, calça, jaqueta, óculos...). Tênis e perfume continuam
// em suas próprias coleções dedicadas (não vale a pena migrar dado real
// do usuário só por uniformidade), mas qualquer categoria nova entra por
// aqui em vez de precisar de mais uma tabela própria.
// Forma: { id, category, brand, model, name, colors: [hex], style,
//          formality, seasonality, image, favorite, createdAt, lastUsedAt }
export function getWardrobeItems() {
  return safeGet(WARDROBE_ITEMS_KEY, [])
}

function saveWardrobeItems(list) {
  safeSet(WARDROBE_ITEMS_KEY, list)
  return list
}

export function addWardrobeItem(data) {
  const list = getWardrobeItems()
  const id = makeItemId(data.name || data.model || data.category, list.map((i) => i.id))
  const item = {
    favorite: false,
    colors: [],
    image: null,
    lastUsedAt: null,
    ...data,
    id,
    createdAt: new Date().toISOString(),
  }
  return saveWardrobeItems([...list, item])
}

export function updateWardrobeItem(id, data) {
  const list = getWardrobeItems()
  return saveWardrobeItems(list.map((i) => (i.id === id ? { ...i, ...data, id } : i)))
}

export function deleteWardrobeItem(id) {
  const list = getWardrobeItems()
  return saveWardrobeItems(list.filter((i) => i.id !== id))
}

// Feedback pós-recomendação (👍 boa sugestão / ❤️ ficou perfeito / 👎 não
// usaria, com motivo opcional) — sinal mais direto que "escolhi outro
// relógio" (choices): aqui a pessoa está avaliando a sugestão em si, não
// só registrando o que vestiu. Alimenta o personalBias v2.
export function getFeedback() {
  return safeGet(FEEDBACK_KEY, [])
}

export function logFeedback(entry) {
  const list = getFeedback()
  const id = `fb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  const next = [{ ...entry, id, date: new Date().toISOString() }, ...list].slice(0, FEEDBACK_LIMIT)
  safeSet(FEEDBACK_KEY, next)
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
    throw new Error('Arquivo inválido: não parece um backup do Watch & Look (sem coleção de relógios).')
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
  safeSet(FAVORITES_KEY, normalized.favorites)
  safeSet(HISTORY_KEY, normalized.history)
  safeSet(CHOICES_KEY, normalized.choices)
  safeSet(FEEDBACK_KEY, normalized.feedback)
  safeSet(SNEAKERS_KEY, normalized.sneakers)
  safeSet(PERFUMES_KEY, normalized.perfumes)
  safeSet(WARDROBE_ITEMS_KEY, normalized.wardrobeItems)
}

export function getFavorites() {
  return safeGet(FAVORITES_KEY, [])
}

export function toggleFavorite(watchId) {
  const favorites = getFavorites()
  const next = favorites.includes(watchId) ? favorites.filter((id) => id !== watchId) : [...favorites, watchId]
  safeSet(FAVORITES_KEY, next)
  return next
}

// Histórico: uma entrada por dia por relógio, mais recente primeiro.
export function getHistory() {
  return safeGet(HISTORY_KEY, [])
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export function logWornToday(watchId) {
  const today = todayStr()
  const history = getHistory().filter((h) => !(h.watchId === watchId && h.date === today))
  const next = [{ watchId, date: today }, ...history].slice(0, HISTORY_LIMIT)
  safeSet(HISTORY_KEY, next)
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
  return safeGet(CHOICES_KEY, [])
}

export function logChoice(entry) {
  const choices = getChoices()
  const next = [{ ...entry, date: new Date().toISOString() }, ...choices].slice(0, CHOICES_LIMIT)
  safeSet(CHOICES_KEY, next)
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
