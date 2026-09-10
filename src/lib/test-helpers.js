// Helpers só pra testes (não é *.test.js, então o Vitest não tenta rodar
// isso como suíte — é importado pelas suítes de verdade).
export function daysAgoStr(days) {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString().slice(0, 10)
}

class MemoryStorage {
  constructor() {
    this.store = new Map()
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null
  }
  setItem(key, value) {
    this.store.set(key, String(value))
  }
  removeItem(key) {
    this.store.delete(key)
  }
  clear() {
    this.store.clear()
  }
}

export function installMemoryLocalStorage() {
  globalThis.localStorage = new MemoryStorage()
}
