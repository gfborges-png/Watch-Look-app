// Sub-score de "combina com o que você costuma gostar" — reaproveitado
// por relógio e tênis, os dois usando o mesmo grupo de paleta (quente/
// frio/terroso/neutro) que storage.personalBias já aprende a partir de
// escolhas + feedback reais.
export function scorePersonalPreference(group, personalBias) {
  if (!personalBias || Object.keys(personalBias).length === 0) return { value: null, reasons: [] }
  const bias = personalBias[group]
  if (bias == null) return { value: null, reasons: [] }
  const value = Math.round(Math.max(0, Math.min(100, 60 + bias * 13)))
  const reasons = []
  if (bias > 0.4) reasons.push('combina com o seu padrão de escolhas anteriores')
  else if (bias < -0.4) reasons.push('foge um pouco do que você costuma escolher')
  return { value, reasons }
}
