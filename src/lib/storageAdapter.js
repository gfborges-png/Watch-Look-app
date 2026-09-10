// Camada de abstração de armazenamento — o único módulo que sabe que
// hoje os dados vivem no localStorage do navegador. storage.js (regras
// de negócio: CRUD de relógios/tênis/perfumes/histórico/feedback) só
// fala com essa interface, nunca com localStorage ou db.js diretamente.
// Uma futura RemoteStorageAdapter (API + autenticação) implementaria a
// mesma interface — get/set/remove por "nome lógico" escopado por
// perfil — e o resto do app não precisaria mudar uma linha.
//
// Perfil local: hoje só existe um perfil, "local-default" (sem login,
// sem tela de conta). Toda chave já nasce escopada por profileId — é o
// que permite, no futuro, trocar esse id por um userId autenticado sem
// reestruturar o storage nem migrar dado por dado.
import { db } from './db.js'

export const DEFAULT_PROFILE_ID = 'local-default'

const NAMESPACE = 'watchlook'
const SCHEMA_VERSION = 3
const SCHEMA_VERSION_KEY = `${NAMESPACE}:schemaVersion`

// Nome lógico (o que storage.js usa) -> chave física de antes de existir
// o conceito de perfil. Só usado pela migração one-shot abaixo.
const LEGACY_KEYS = {
  collection: `${NAMESPACE}:collection`,
  favorites: `${NAMESPACE}:favorites`,
  history: `${NAMESPACE}:history`,
  choices: `${NAMESPACE}:choices`,
  sneakers: `${NAMESPACE}:sneakers`,
  perfumes: `${NAMESPACE}:perfumes`,
  wardrobeItems: `${NAMESPACE}:wardrobeItems`,
  feedback: `${NAMESPACE}:feedback`,
}

function scopedKey(profileId, name) {
  return `${NAMESPACE}:${profileId}:${name}`
}

// Roda uma vez por navegador: copia qualquer dado no formato antigo
// (chaves sem profileId) pra debaixo do perfil local. Idempotente —
// marca schemaVersion e nunca reprocessa — e nunca apaga a chave
// antiga, só copia; sem dado legado, é um no-op instantâneo. Exportada
// só pra teste; o resto do app não chama isso diretamente.
export function migrateLegacyKeys() {
  const currentVersion = db.get(SCHEMA_VERSION_KEY, 0)
  if (currentVersion >= SCHEMA_VERSION) return

  for (const [name, legacyKey] of Object.entries(LEGACY_KEYS)) {
    const newKey = scopedKey(DEFAULT_PROFILE_ID, name)
    const alreadyMigrated = db.get(newKey, undefined) !== undefined
    if (alreadyMigrated) continue
    const legacyValue = db.get(legacyKey, undefined)
    if (legacyValue !== undefined) db.set(newKey, legacyValue)
  }
  db.set(SCHEMA_VERSION_KEY, SCHEMA_VERSION)
}

migrateLegacyKeys()

// Interface que uma futura RemoteStorageAdapter implementaria igual:
// get/set/remove por nome lógico, sempre escopado a um perfil.
function createLocalStorageAdapter(profileId = DEFAULT_PROFILE_ID) {
  return {
    profileId,
    get(name, fallback) {
      return db.get(scopedKey(profileId, name), fallback)
    },
    set(name, value) {
      db.set(scopedKey(profileId, name), value)
      return value
    },
    remove(name) {
      db.remove(scopedKey(profileId, name))
    },
  }
}

export const storageAdapter = createLocalStorageAdapter()

// Atalhos com os nomes conceituais do domínio (perfil, preferências) —
// mesma interface, só nomeada como o resto do produto pensa nesses
// dados. Guarda-roupa/histórico/feedback já têm CRUD fino e nomeado em
// storage.js (getSneakers, getHistory, getFeedback...), que é
// estritamente melhor que um blob genérico — ambos os caminhos passam
// pelo mesmo storageAdapter por baixo.
export const getProfile = (fallback) => storageAdapter.get('profile', fallback)
export const saveProfile = (value) => storageAdapter.set('profile', value)
export const getPreferences = (fallback) => storageAdapter.get('preferences', fallback)
export const savePreferences = (value) => storageAdapter.set('preferences', value)
