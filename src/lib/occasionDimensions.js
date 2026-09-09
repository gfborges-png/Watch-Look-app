// Perfil-alvo de cada ocasião nas 3 dimensões que watchModel já deriva
// pra cada relógio (formalidade, esportividade, "statement level") —
// fonte ÚNICA usada por relógio, tênis e (por proximidade de ocasião)
// perfume, pra saber o que a ocasião pede. Adicionar uma ocasião nova é
// uma linha aqui, não uma mudança espalhada em vários motores.
export const OCCASION_DIMENSIONS = {
  trabalho: { formality: 80, sportiness: 20, statement: 25 },
  reuniaoImportante: { formality: 95, sportiness: 5, statement: 15 },
  casual: { formality: 45, sportiness: 45, statement: 40 },
  treino: { formality: 5, sportiness: 95, statement: 30 },
  fimDeSemana: { formality: 35, sportiness: 50, statement: 65 },
  jantarRomantico: { formality: 75, sportiness: 15, statement: 45 },
  festa: { formality: 35, sportiness: 30, statement: 80 },
  casamento: { formality: 90, sportiness: 10, statement: 35 },
}

export const OCCASION_LABELS = Object.fromEntries([
  ['trabalho', 'o trabalho'],
  ['reuniaoImportante', 'uma reunião importante'],
  ['casual', 'o dia a dia casual'],
  ['treino', 'o treino'],
  ['fimDeSemana', 'o fim de semana'],
  ['jantarRomantico', 'um jantar romântico'],
  ['festa', 'uma festa'],
  ['casamento', 'um casamento'],
])

// Quão "parecidas" duas ocasiões são, pelas mesmas 3 dimensões — usado
// quando algo só faz sentido pra uma ocasião específica (ex: um perfume
// cadastrado pensado pro "jantar romântico") mas o dia pede outra: em
// vez de zerar, aproxima pela distância real entre as duas.
export function occasionDistance(idA, idB) {
  if (idA === idB) return 0
  const a = OCCASION_DIMENSIONS[idA]
  const b = OCCASION_DIMENSIONS[idB]
  if (!a || !b) return 100
  return Math.abs(a.formality - b.formality) * 0.5 + Math.abs(a.statement - b.statement) * 0.3 + Math.abs(a.sportiness - b.sportiness) * 0.2
}
