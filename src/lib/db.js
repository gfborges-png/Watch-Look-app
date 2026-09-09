// Camada fina de armazenamento local. Toda leitura/escrita do app passa
// por aqui em vez de chamar localStorage direto — se um dia o volume de
// dados justificar migrar pra IndexedDB (mais assets, mais histórico),
// só essa camada muda; storage.js e o resto do app continuam iguais.
// Por enquanto localStorage é suficiente (dados pequenos, só texto/JSON).
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
    return true
  } catch {
    // localStorage indisponível (modo privado, storage cheio) — segue sem persistir
    return false
  }
}

function safeRemove(key) {
  try {
    localStorage.removeItem(key)
  } catch {
    // nada pra limpar
  }
}

export const db = { get: safeGet, set: safeSet, remove: safeRemove }
