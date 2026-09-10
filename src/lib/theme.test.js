import { describe, it, expect, beforeEach } from 'vitest'
import { getThemePreference, setThemePreference, nextThemePreference } from './theme.js'

describe('theme preference (storage)', () => {
  beforeEach(() => localStorage.clear())

  it('sem escolha nenhuma, começa em null (sistema)', () => {
    expect(getThemePreference()).toBeNull()
  })

  it('escolher claro/escuro persiste e é lido de volta', () => {
    setThemePreference('dark')
    expect(getThemePreference()).toBe('dark')
    setThemePreference('light')
    expect(getThemePreference()).toBe('light')
  })

  it('voltar pra sistema (null) remove a escolha, não grava um terceiro valor', () => {
    setThemePreference('dark')
    setThemePreference(null)
    expect(getThemePreference()).toBeNull()
  })
})

describe('nextThemePreference — ciclo sistema → claro → escuro → sistema', () => {
  it('percorre os três estados e fecha o ciclo', () => {
    expect(nextThemePreference(null)).toBe('light')
    expect(nextThemePreference('light')).toBe('dark')
    expect(nextThemePreference('dark')).toBeNull()
  })
})
