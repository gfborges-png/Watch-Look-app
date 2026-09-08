// Persistência local (favoritos + histórico de uso). Tudo fica só no
// navegador do usuário — não tem backend, então cada leitura/escrita é
// protegida contra localStorage indisponível (modo privado, etc).
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
