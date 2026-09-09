import { useState } from 'react'
import { getOrCreateLocalProfile } from '../lib/localProfile.js'

// Inicializador preguiçoso do useState roda só uma vez, no primeiro
// render — suficiente pra garantir que o LocalProfile existe, sem
// precisar de useEffect nem de nenhuma tela nova.
export function useLocalProfile() {
  const [profile] = useState(getOrCreateLocalProfile)
  return profile
}
