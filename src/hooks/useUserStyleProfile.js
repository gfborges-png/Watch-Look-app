import { useMemo } from 'react'
import { computeUserStyleProfile, describeStyleProfile } from '../lib/userStyleProfile.js'

// "Seu estilo" nunca é uma config manual — é sempre recalculado a partir
// dos dados reais (coleção, escolhas, feedback, favoritos) que já
// existem no app. A mesma função funcionaria igual pra qualquer outro
// usuário de uma futura versão pública.
export function useUserStyleProfile({ collection, choices, feedback, favorites }) {
  const profile = useMemo(
    () => computeUserStyleProfile({ collection, choices, feedback, favorites }),
    [collection, choices, feedback, favorites],
  )
  const insights = useMemo(() => describeStyleProfile(profile), [profile])
  return { profile, insights }
}
