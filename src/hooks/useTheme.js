import { useState } from 'react'
import { getThemePreference, setThemePreference, nextThemePreference } from '../lib/theme.js'

// A aplicação no <html> já aconteceu de forma síncrona em main.jsx
// (antes do primeiro render, pra não piscar o tema errado) — aqui só
// espelha o estado atual e oferece o ciclo sistema→claro→escuro.
export function useTheme() {
  const [theme, setTheme] = useState(getThemePreference)

  const cycleTheme = () => {
    const next = nextThemePreference(theme)
    setThemePreference(next)
    setTheme(next)
  }

  return { theme, cycleTheme }
}
