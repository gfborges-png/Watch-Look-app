// LocalProfile — registro mínimo de "quem é o dono desses dados" mesmo
// sem login. Hoje só existe um, id fixo (DEFAULT_PROFILE_ID); é o mesmo
// registro que uma conta autenticada substituiria no futuro (trocando o
// id por um userId real), sem mudar o resto do app — que já lê/escreve
// tudo por profileId via storageAdapter, nunca assume um único usuário
// global implícito.
import { getProfile, saveProfile, DEFAULT_PROFILE_ID } from './storageAdapter.js'

function blankProfile() {
  const now = new Date().toISOString()
  return { id: DEFAULT_PROFILE_ID, name: 'Você', createdAt: now, settings: {} }
}

// Lazy: não existe tela de "criar conta", então o primeiro acesso ao
// app já garante que o registro existe, pronto pra virar owner de
// qualquer coisa que futuramente precisar referenciar um profileId.
export function getOrCreateLocalProfile() {
  const existing = getProfile(null)
  if (existing) return existing
  const profile = blankProfile()
  saveProfile(profile)
  return profile
}
