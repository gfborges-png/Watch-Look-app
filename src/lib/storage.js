// Persistência local (coleção editável + favoritos + histórico de uso).
// Tudo fica só no navegador do usuário — não tem backend, então cada
// leitura/escrita é protegida contra localStorage indisponível (modo
// privado, etc).
import { watches as defaultWatches } from '../data/watches.js'

const COLLECTION_KEY = 'watchlook:collection'
const FAVORITES_KEY = 'watchlook:favorites'
const HISTORY_KEY = 'watchlook:history'
const CHOICES_KEY = 'watchlook:choices'
const SNEAKERS_KEY = 'watchlook:sneakers'
const PERFUMES_KEY = 'watchlook:perfumes'
const HISTORY_LIMIT = 200
const CHOICES_LIMIT = 150
const RECENT_DAYS = 2
const BASE_GROUPS = ['quente', 'frio', 'terroso', 'neutro']

function safeGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage indisponível (modo privado, storage cheio) — segue sem persistir
  }
}

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
  try {
    localStorage.removeItem(COLLECTION_KEY)
  } catch {
    // localStorage indisponível — nada pra limpar
  }
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

// Backup: um único JSON com coleção + favoritos + histórico + guarda-roupa,
// pra não perder tudo se limpar os dados do navegador ou trocar de aparelho.
export function exportData() {
  return {
    app: 'watch-look',
    version: 1,
    exportedAt: new Date().toISOString(),
    collection: getCollection(),
    favorites: getFavorites(),
    history: getHistory(),
    choices: getChoices(),
    sneakers: getSneakers(),
    perfumes: getPerfumes(),
  }
}

export function importData(data) {
  if (!data || typeof data !== 'object' || !Array.isArray(data.collection)) {
    throw new Error('Arquivo inválido: não parece um backup do Watch & Look.')
  }
  saveCollection(data.collection)
  if (Array.isArray(data.favorites)) safeSet(FAVORITES_KEY, data.favorites)
  if (Array.isArray(data.history)) safeSet(HISTORY_KEY, data.history)
  if (Array.isArray(data.choices)) safeSet(CHOICES_KEY, data.choices)
  if (Array.isArray(data.sneakers)) safeSet(SNEAKERS_KEY, data.sneakers)
  if (Array.isArray(data.perfumes)) safeSet(PERFUMES_KEY, data.perfumes)
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

// Ids usados nos últimos RECENT_DAYS dias — usado pro match dar variedade
// em vez de sugerir sempre o mesmo relógio.
export function recentlyWornIds(history) {
  return new Set(history.filter((h) => daysSince(h.date) <= RECENT_DAYS).map((h) => h.watchId))
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

// Compara, nas últimas `sampleSize` escolhas, com que frequência cada
// grupo de paleta foi escolhido contra uma base uniforme (25% cada) —
// vira um pequeno bônus/penalidade de pontuação por grupo. Só age depois
// de um mínimo de dados, senão qualquer escolha isolada vira ruído.
export function personalBias(choices, sampleSize = 20) {
  const recent = choices.slice(0, sampleSize)
  if (recent.length < 4) return {}
  const counts = Object.fromEntries(BASE_GROUPS.map((g) => [g, 0]))
  for (const c of recent) {
    if (c.group in counts) counts[c.group] += 1
  }
  const bias = {}
  for (const g of BASE_GROUPS) {
    bias[g] = (counts[g] / recent.length - 1 / BASE_GROUPS.length) * 4
  }
  return bias
}
