// Persistência local (coleção editável + favoritos + histórico de uso).
// Tudo fica só no navegador do usuário — não tem backend, então cada
// leitura/escrita é protegida contra localStorage indisponível (modo
// privado, etc).
import { watches as defaultWatches } from '../data/watches.js'

const COLLECTION_KEY = 'watchlook:collection'
const FAVORITES_KEY = 'watchlook:favorites'
const HISTORY_KEY = 'watchlook:history'
const HISTORY_LIMIT = 200
const RECENT_DAYS = 2

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

function makeWatchId(nome, existingIds) {
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
  const id = makeWatchId(watchData.nome, collection.map((w) => w.id))
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

// Backup: um único JSON com coleção + favoritos + histórico, pra não
// perder tudo se limpar os dados do navegador ou trocar de aparelho.
export function exportData() {
  return {
    app: 'watch-look',
    version: 1,
    exportedAt: new Date().toISOString(),
    collection: getCollection(),
    favorites: getFavorites(),
    history: getHistory(),
  }
}

export function importData(data) {
  if (!data || typeof data !== 'object' || !Array.isArray(data.collection)) {
    throw new Error('Arquivo inválido: não parece um backup do Watch & Look.')
  }
  saveCollection(data.collection)
  if (Array.isArray(data.favorites)) safeSet(FAVORITES_KEY, data.favorites)
  if (Array.isArray(data.history)) safeSet(HISTORY_KEY, data.history)
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
