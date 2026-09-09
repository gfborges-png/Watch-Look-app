// Dimensões estendidas do relógio (tipo, formalidade, esportividade,
// "statement level", sazonalidade, material da pulseira) — usadas pelo
// motor de recomendação v2 e pelos filtros da coleção.
//
// Em vez de migrar os 23 relógios padrão (e os que o usuário já cadastrou)
// pra um novo formato, essas dimensões são DERIVADAS sob demanda a partir
// dos campos que já existem (estilo, nome, pulseira, cor, accent, hexes).
// Isso evita qualquer script de migração: dado antigo continua funcionando
// sem tocar em nada. Se o relógio já tiver um valor explícito salvo nesses
// campos (via um formulário futuro), esse valor sempre vence sobre o
// derivado — `getWatchDimensions` já resolve essa precedência.
import { getStyleTags } from './outfitEngine.js'

export const WATCH_TYPES = [
  { id: 'dress', label: 'Dress' },
  { id: 'sport', label: 'Sport' },
  { id: 'diver', label: 'Diver' },
  { id: 'chronograph', label: 'Chronograph' },
  { id: 'gmt', label: 'GMT' },
  { id: 'field', label: 'Field' },
  { id: 'casual', label: 'Casual' },
]

const BRACELET_MATERIAL_RULES = [
  { id: 'couro', test: (s) => s.includes('couro') || s.includes('leather') || s.includes('alligator') || s.includes('jacaré') },
  { id: 'borracha', test: (s) => s.includes('borracha') || s.includes('rubber') || s.includes('fkm') },
  { id: 'têxtil', test: (s) => s.includes('nato') || s.includes('têxtil') || s.includes('textil') || s.includes('nylon') || s.includes('sailcloth') },
  { id: 'aço', test: (s) => s.includes('aço') || s.includes('aco') || s.includes('steel') || s.includes('bracelet') || s.includes('jubilee') || s.includes('oyster') },
  { id: 'titânio', test: (s) => s.includes('titânio') || s.includes('titanio') || s.includes('titanium') },
]

// chrono/gmt/field não fazem parte dos 5 estilos que outfitEngine já
// detecta (dress/racing/diver/sport/casual) — soma esses três por cima.
function inferExtraTypeTags(estilo, nome) {
  const s = `${estilo} ${nome}`.toLowerCase()
  const tags = []
  if (s.includes('chrono') || s.includes('cronó') || s.includes('cronografo')) tags.push('chronograph')
  if (s.includes('gmt') || s.includes('gtt') || s.includes('dual time')) tags.push('gmt')
  if (s.includes('field') || s.includes('militar') || s.includes('military') || s.includes('explorer') || s.includes('aventureiro')) tags.push('field')
  return tags
}

export function inferWatchTypes(watch) {
  const base = getStyleTags(watch.estilo) // dress/racing/diver/sport/casual (racing colapsa em sport)
  const mapped = base.map((t) => (t === 'racing' ? 'sport' : t))
  const extra = inferExtraTypeTags(watch.estilo, watch.nome)
  const all = [...new Set([...mapped, ...extra])]
  return all.length > 0 ? all : ['casual']
}

function isWorkStyle(estilo) {
  const s = estilo.toLowerCase()
  return s.includes('dress') || s.includes('elegante') || s.includes('smart') || s.includes('técnico') || s.includes('luxo')
}

function isBoldStyle(estilo) {
  const s = estilo.toLowerCase()
  return s.includes('bold') || s.includes('statement') || s.includes('racing') || s.includes('vibrante')
}

// 0-100. Dress/elegante puxa alto; statement/bold puxa baixo; o resto
// fica no meio — reaproveita a mesma leitura de texto que o matchEngine
// já usa pra decidir contexto de trabalho.
export function inferFormality(watch) {
  if (typeof watch.formality === 'number') return watch.formality
  const estilo = watch.estilo ?? ''
  if (isWorkStyle(estilo)) return 80
  if (isBoldStyle(estilo)) return 30
  const types = inferWatchTypes(watch)
  if (types.includes('dress')) return 80
  if (types.includes('sport') || types.includes('diver')) return 40
  return 55
}

// 0-100, grosso modo o inverso da formalidade, mas com peso extra pra
// tipos claramente esportivos (diver/chrono/sport).
export function inferSportiness(watch) {
  if (typeof watch.sportiness === 'number') return watch.sportiness
  const types = inferWatchTypes(watch)
  let score = 100 - inferFormality(watch)
  if (types.includes('diver') || types.includes('sport') || types.includes('chronograph')) score += 15
  return Math.max(0, Math.min(100, score))
}

// 0-100 — quanto o relógio "chama atenção": cor de destaque real, mais de
// uma cor no mostrador, ou um estilo explicitamente descrito como bold.
export function inferStatementLevel(watch) {
  if (typeof watch.statementLevel === 'number') return watch.statementLevel
  const estilo = watch.estilo ?? ''
  let score = 30
  if (isBoldStyle(estilo)) score += 35
  if (watch.accent) score += 15
  if (Array.isArray(watch.hexes) && watch.hexes.length > 1) score += 15
  if (watch.cor === 'neutro') score -= 10
  return Math.max(0, Math.min(100, score))
}

export function inferSeasonality(watch) {
  if (watch.seasonality) return watch.seasonality
  const estilo = (watch.estilo ?? '').toLowerCase()
  if (estilo.includes('verão') || estilo.includes('verao')) return 'verao'
  if (estilo.includes('inverno')) return 'inverno'
  return 'all'
}

export function inferBraceletMaterial(watch) {
  if (watch.braceletMaterial) return watch.braceletMaterial
  const text = `${watch.pulseira ?? ''} ${watch.pulseiraAlt ?? ''}`.toLowerCase()
  const match = BRACELET_MATERIAL_RULES.find((r) => r.test(text))
  return match?.id ?? 'outro'
}

// Ponto único de entrada: resolve todas as dimensões de um relógio,
// priorizando valor explícito salvo no objeto sobre o inferido.
export function getWatchDimensions(watch) {
  return {
    types: inferWatchTypes(watch),
    formality: inferFormality(watch),
    sportiness: inferSportiness(watch),
    statementLevel: inferStatementLevel(watch),
    seasonality: inferSeasonality(watch),
    braceletMaterial: inferBraceletMaterial(watch),
    caseColor: watch.caseColor ?? null,
    braceletColor: watch.braceletColor ?? null,
    diameter: watch.diameter ?? null,
  }
}
