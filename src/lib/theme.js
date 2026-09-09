// Preferência de tema explícita — 'light' | 'dark' | null. `null`
// significa "sistema": nunca é persistido como um valor próprio, só a
// AUSÊNCIA de escolha (remover a chave), então o app sempre volta a
// seguir prefers-color-scheme por padrão. A escolha explícita, quando
// existe, sobrepõe o sistema nos dois sentidos — ver a regra CSS
// correspondente em src/index.css (data-theme="light"/"dark").
import { storageAdapter } from './storageAdapter.js'

export function getThemePreference() {
  return storageAdapter.get('themePreference', null)
}

export function applyThemePreference(theme) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (theme === 'light' || theme === 'dark') root.setAttribute('data-theme', theme)
  else root.removeAttribute('data-theme')
}

export function setThemePreference(theme) {
  if (theme === 'light' || theme === 'dark') storageAdapter.set('themePreference', theme)
  else storageAdapter.remove('themePreference')
  applyThemePreference(theme)
}

// Ciclo de três estados: sistema → claro → escuro → sistema.
export function nextThemePreference(current) {
  if (current === null) return 'light'
  if (current === 'light') return 'dark'
  return null
}
