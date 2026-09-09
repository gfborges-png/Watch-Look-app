import { installMemoryLocalStorage } from './lib/test-helpers.js'

// storage.js (via db.js) chama localStorage direto — Node não tem esse
// global, então instala um polyfill em memória só pros testes.
installMemoryLocalStorage()
