import { useMemo } from 'react'
import { personalBias } from '../lib/storage.js'

// "Preferência pessoal" não é um formulário de configuração — é aprendida
// a partir de escolhas manuais + feedback pós-sugestão (ver storage.js).
export function usePreferences(choices, feedback) {
  const bias = useMemo(() => personalBias(choices, feedback), [choices, feedback])
  return { bias }
}
