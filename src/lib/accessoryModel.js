// Modelo e taxonomia de Acessórios — mais uma dimensão da composição de
// estilo (roupas + calçados + relógios + acessórios + perfumes), sempre
// opcional. Mesmo espírito das outras categorias do guarda-roupa: sem
// campo obrigatório além do essencial pro motor de match funcionar (tipo
// + cor), pra manter o cadastro rápido.
//
// Forma de um acessório: { id, type, name, brand, primaryColor (hex de
// LOOK_COLORS), material, style (array), watchCompatibility, image }.
// `image` fica sempre null nesta etapa — o app inteiro já representa
// itens visualmente por swatch de cor (relógio/tênis/perfume), não por
// foto persistida (sem upload/armazenamento de imagem em lugar nenhum
// hoje); acessórios seguem o mesmo padrão em vez de introduzir um
// mecanismo novo só pra essa categoria.
export const ACCESSORY_TYPES = [
  { id: 'pulseira', label: 'Pulseira' },
  { id: 'colar', label: 'Colar' },
  { id: 'anel', label: 'Anel' },
  { id: 'oculos', label: 'Óculos' },
  { id: 'cinto', label: 'Cinto' },
  { id: 'bone', label: 'Boné/Chapéu' },
  { id: 'lenco', label: 'Lenço' },
  { id: 'outro', label: 'Outro' },
]

export const ACCESSORY_MATERIALS = [
  { id: 'couro', label: 'Couro' },
  { id: 'aco', label: 'Aço' },
  { id: 'prata', label: 'Prata' },
  { id: 'dourado', label: 'Dourado' },
  { id: 'pedra', label: 'Pedra' },
  { id: 'tecido', label: 'Tecido' },
  { id: 'cordao', label: 'Cordão' },
  { id: 'madeira', label: 'Madeira' },
  { id: 'resina', label: 'Resina' },
  { id: 'outro', label: 'Outro' },
]

export const ACCESSORY_STYLES = [
  { id: 'minimalista', label: 'Minimalista' },
  { id: 'casual', label: 'Casual' },
  { id: 'elegante', label: 'Elegante' },
  { id: 'classico', label: 'Clássico' },
  { id: 'esportivo', label: 'Esportivo' },
  { id: 'streetwear', label: 'Streetwear' },
  { id: 'criativo', label: 'Criativo' },
  { id: 'fashion', label: 'Fashion' },
]

// yes/no/neutral no dado; "Sim"/"Não"/"Tanto faz" só na exibição.
export const WATCH_COMPATIBILITY = [
  { id: 'yes', label: 'Sim' },
  { id: 'no', label: 'Não' },
  { id: 'neutral', label: 'Tanto faz' },
]

export const ACCESSORY_TYPE_LABEL = Object.fromEntries(ACCESSORY_TYPES.map((t) => [t.id, t.label]))
export const ACCESSORY_MATERIAL_LABEL = Object.fromEntries(ACCESSORY_MATERIALS.map((m) => [m.id, m.label]))
export const ACCESSORY_STYLE_LABEL = Object.fromEntries(ACCESSORY_STYLES.map((s) => [s.id, s.label]))
export const WATCH_COMPATIBILITY_LABEL = Object.fromEntries(WATCH_COMPATIBILITY.map((w) => [w.id, w.label]))

// Formalidade-alvo 0-100 por material/estilo — mesma ideia de
// watchModel.inferFormality, mas pra acessório: usada pelo motor de
// match (accessoryMatch.js) pra comparar com a formalidade da ocasião.
export const MATERIAL_FORMALITY = {
  couro: 65,
  aco: 55,
  prata: 65,
  dourado: 70,
  pedra: 40,
  tecido: 30,
  cordao: 25,
  madeira: 35,
  resina: 30,
  outro: 50,
}

export const STYLE_FORMALITY = {
  minimalista: 65,
  casual: 35,
  elegante: 85,
  classico: 75,
  esportivo: 20,
  streetwear: 20,
  criativo: 45,
  fashion: 55,
}

// Média entre a formalidade "material" e a formalidade "estilo" (quando
// o acessório tem estilo marcado) — nenhuma das duas sozinha conta a
// história inteira (uma pulseira de couro pode ser tanto clássica quanto
// streetwear; o material dá o piso, o estilo ajusta pra cima/baixo).
export function inferAccessoryFormality(accessory) {
  const materialFormality = MATERIAL_FORMALITY[accessory.material] ?? 50
  const styleValues = (accessory.style ?? []).map((s) => STYLE_FORMALITY[s]).filter((v) => v != null)
  if (styleValues.length === 0) return materialFormality
  const styleFormality = styleValues.reduce((a, b) => a + b, 0) / styleValues.length
  return Math.round((materialFormality + styleFormality) / 2)
}

export function accessoryDisplayName(accessory) {
  return accessory.name?.trim() || ACCESSORY_TYPE_LABEL[accessory.type] || 'Acessório'
}
