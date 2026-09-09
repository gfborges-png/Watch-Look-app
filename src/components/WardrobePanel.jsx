import { useState } from 'react'
import { GARMENTS, LOOK_COLORS } from '../lib/matchEngine.js'
import { KNOWN_FAMILIES, matchFamilyName, notasFromImportItem } from '../lib/perfumeEngine.js'
import { matchColorNameToHexes, guessBrand } from '../lib/colorNameMatch.js'
import {
  ACCESSORY_TYPES,
  ACCESSORY_MATERIALS,
  ACCESSORY_STYLES,
  WATCH_COMPATIBILITY,
  ACCESSORY_MATERIAL_LABEL,
  ACCESSORY_STYLE_LABEL,
  accessoryDisplayName,
} from '../lib/accessoryModel.js'
import FilterBar, { Chip } from './FilterBar.jsx'
import ColorSwatch from './ColorSwatch.jsx'
import ForgottenWatches from './ForgottenWatches.jsx'
import WatchCard from './WatchCard.jsx'

const inputClass =
  'w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

const SNEAKER_TIPOS = GARMENTS.find((g) => g.key === 'calcado').tipos
const BLANK_SNEAKER = { nome: '', marca: '', tipo: 'Tênis', hexes: ['#F5F3EE'] }
const BLANK_PERFUME = { nome: '', marca: '', familia: KNOWN_FAMILIES[0], notas: '' }
const BLANK_ACCESSORY = {
  type: ACCESSORY_TYPES[0].id,
  name: '',
  brand: '',
  primaryColor: LOOK_COLORS[0].hex,
  material: ACCESSORY_MATERIALS[0].id,
  style: [],
  watchCompatibility: 'neutral',
  image: null,
}

// Rótulo de uma cor cadastrada, buscando o hex exato na paleta do app
// (o seletor de cor do tênis só oferece esses hexes, então sempre bate).
function colorLabel(hex) {
  return LOOK_COLORS.find((c) => c.hex === hex)?.label ?? hex
}

// "Branco com Azul" vs "Azul com Branco" — a ordem em que as cores foram
// escolhidas decide qual é a dominante, então vira a primeira do rótulo.
function colorComboLabel(hexes) {
  return hexes.map(colorLabel).join(' com ')
}

// Mesmo mostruário de cores nomeadas usado no look (LookMatcher/ColorRow),
// mas com seleção múltipla (até 2, em ordem) em vez de uma roda de cor
// livre — assim o tênis cadastrado já nasce com uma cor exata da paleta
// que o motor de match usa, sem precisar aproximar depois.
function SneakerColorPicker({ hexes, onChange }) {
  const toggle = (hex) => {
    const idx = hexes.indexOf(hex)
    if (idx !== -1) {
      if (hexes.length === 1) return
      onChange(hexes.filter((h) => h !== hex))
    } else if (hexes.length < 2) {
      onChange([...hexes, hex])
    } else {
      onChange([hexes[1], hex])
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {LOOK_COLORS.map((c) => {
        const order = hexes.indexOf(c.hex)
        const active = order !== -1
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => toggle(c.hex)}
            title={c.label}
            aria-label={c.label}
            aria-pressed={active}
            className={`relative h-8 w-8 shrink-0 rounded-full ring-2 transition ${
              active ? 'ring-accent scale-110' : 'ring-transparent hover:ring-border'
            }`}
            style={{ background: c.hex }}
          >
            {active && hexes.length === 2 && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-accent text-[9px] font-bold leading-none text-bone">
                {order + 1}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-wide text-text-muted">
        {label} {required && <span className="text-accent">*</span>}
      </span>
      {children}
    </label>
  )
}

function EditIconButton({ onClick, label }) {
  return (
    <button onClick={onClick} aria-label={label} className="rounded-full p-2 text-text-muted transition hover:bg-surface-3 hover:text-text">
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    </button>
  )
}

function SneakerForm({ initial, onSave, onCancel, onDelete }) {
  const [form, setForm] = useState(initial ? { ...BLANK_SNEAKER, ...initial } : BLANK_SNEAKER)
  const [error, setError] = useState(null)
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.nome.trim()) {
      setError('Dá um nome pro tênis (ex: modelo + colorway).')
      return
    }
    onSave({ ...form, nome: form.nome.trim(), marca: form.marca.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-surface-2/60 p-5">
      <Field label="Nome" required>
        <input className={inputClass} value={form.nome} onChange={set('nome')} placeholder="Ex: Dunk Low Travis Scott Golf" />
      </Field>
      <Field label="Marca">
        <input className={inputClass} value={form.marca} onChange={set('marca')} placeholder="Ex: Nike" />
      </Field>
      <Field label="Tipo">
        <div className="flex flex-wrap gap-1.5">
          {SNEAKER_TIPOS.map((t) => (
            <Chip key={t} active={form.tipo === t} onClick={() => setForm((f) => ({ ...f, tipo: t }))}>
              {t}
            </Chip>
          ))}
        </div>
      </Field>
      <div>
        <span className="mb-1 block text-xs uppercase tracking-wide text-text-muted">
          Cor (até 2) <span className="text-accent">*</span>
        </span>
        <SneakerColorPicker hexes={form.hexes} onChange={(hexes) => setForm((f) => ({ ...f, hexes }))} />
        <p className="mt-1.5 text-xs text-text-muted">
          {colorComboLabel(form.hexes)}
          {form.hexes.length < 2 && ' — toca em outra cor pra fazer uma combinação (ex: Branco com Azul)'}
        </p>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button type="submit" className="flex-1 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-bone transition hover:opacity-90">
          Salvar
        </button>
        {onDelete && (
          <button type="button" onClick={onDelete} className="rounded-full border border-red-500/30 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/10">
            Remover
          </button>
        )}
        <button type="button" onClick={onCancel} className="rounded-full border border-border px-4 py-2.5 text-sm font-medium text-text-muted transition hover:bg-surface-3">
          Cancelar
        </button>
      </div>
    </form>
  )
}

function PerfumeForm({ initial, onSave, onCancel, onDelete }) {
  const [form, setForm] = useState(initial ? { ...BLANK_PERFUME, ...initial } : BLANK_PERFUME)
  const [error, setError] = useState(null)
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.nome.trim()) {
      setError('Dá um nome pro perfume.')
      return
    }
    onSave({ ...form, nome: form.nome.trim(), marca: form.marca.trim(), notas: form.notas.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-accent/25 bg-surface-2/60 p-5">
      <Field label="Nome" required>
        <input className={inputClass} value={form.nome} onChange={set('nome')} placeholder="Ex: Bleu de Chanel EDP" />
      </Field>
      <Field label="Marca">
        <input className={inputClass} value={form.marca} onChange={set('marca')} placeholder="Ex: Chanel" />
      </Field>
      <Field label="Família olfativa" required>
        <select className={inputClass} value={form.familia} onChange={set('familia')}>
          {KNOWN_FAMILIES.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-xs text-text-muted">
          É essa família que decide quando esse perfume vira sugestão pra um clima/ocasião.
        </span>
      </Field>
      <Field label="Notas">
        <input className={inputClass} value={form.notas} onChange={set('notas')} placeholder="Ex: bergamota, cedro, almíscar (opcional)" />
        <span className="mt-1 block text-xs text-text-muted">
          Ajuda a refinar pro clima do dia — notas frescas/cítricas (bergamota, limão) pesam pra dias quentes; notas
          densas/amadeiradas (âmbar, baunilha, couro) pesam pra dias frios. Se você tiver mais de um perfume da mesma
          família, isso decide qual aparece primeiro.
        </span>
      </Field>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button type="submit" className="flex-1 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-bone transition hover:opacity-90">
          Salvar
        </button>
        {onDelete && (
          <button type="button" onClick={onDelete} className="rounded-full border border-red-500/30 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/10">
            Remover
          </button>
        )}
        <button type="button" onClick={onCancel} className="rounded-full border border-border px-4 py-2.5 text-sm font-medium text-text-muted transition hover:bg-surface-3">
          Cancelar
        </button>
      </div>
    </form>
  )
}

// Cor principal do acessório — uma só (ao contrário do seletor de tênis,
// que permite até 2), da mesma paleta LOOK_COLORS usada em todo o app,
// pra o motor de match comparar sem precisar aproximar cor depois.
function AccessoryColorPicker({ hex, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {LOOK_COLORS.map((c) => {
        const active = hex === c.hex
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onChange(c.hex)}
            title={c.label}
            aria-label={c.label}
            aria-pressed={active}
            className={`h-8 w-8 shrink-0 rounded-full ring-2 transition ${
              active ? 'ring-accent scale-110' : 'ring-transparent hover:ring-border'
            }`}
            style={{ background: c.hex }}
          />
        )
      })}
    </div>
  )
}

// Cadastro rápido de acessório — nada obrigatório além do tipo (nome e
// marca são opcionais, por espec), então sem estado de erro/validação
// como Sneaker/PerfumeForm têm: qualquer combinação de campos já é um
// acessório válido.
function AccessoryForm({ initial, onSave, onCancel, onDelete }) {
  const [form, setForm] = useState(initial ? { ...BLANK_ACCESSORY, ...initial } : BLANK_ACCESSORY)
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const toggleStyle = (styleId) =>
    setForm((f) => ({
      ...f,
      style: f.style.includes(styleId) ? f.style.filter((s) => s !== styleId) : [...f.style, styleId],
    }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({ ...form, name: form.name.trim(), brand: form.brand.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-surface-2/60 p-5">
      <Field label="Tipo" required>
        <div className="flex flex-wrap gap-1.5">
          {ACCESSORY_TYPES.map((t) => (
            <Chip key={t.id} active={form.type === t.id} onClick={() => setForm((f) => ({ ...f, type: t.id }))}>
              {t.label}
            </Chip>
          ))}
        </div>
      </Field>
      <Field label="Nome">
        <input className={inputClass} value={form.name} onChange={set('name')} placeholder="Ex: Pulseira de couro preta (opcional)" />
      </Field>
      <Field label="Marca">
        <input className={inputClass} value={form.brand} onChange={set('brand')} placeholder="Opcional" />
      </Field>
      <div>
        <span className="mb-1 block text-xs uppercase tracking-wide text-text-muted">Cor principal</span>
        <AccessoryColorPicker hex={form.primaryColor} onChange={(hex) => setForm((f) => ({ ...f, primaryColor: hex }))} />
      </div>
      <Field label="Material">
        <select className={inputClass} value={form.material} onChange={set('material')}>
          {ACCESSORY_MATERIALS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </Field>
      <div>
        <span className="mb-1 block text-xs uppercase tracking-wide text-text-muted">Estilo (um ou mais)</span>
        <div className="flex flex-wrap gap-1.5">
          {ACCESSORY_STYLES.map((s) => (
            <Chip key={s.id} active={form.style.includes(s.id)} onClick={() => toggleStyle(s.id)}>
              {s.label}
            </Chip>
          ))}
        </div>
      </div>
      <div>
        <span className="mb-1 block text-xs uppercase tracking-wide text-text-muted">Usar junto com relógio?</span>
        <div className="flex flex-wrap gap-1.5">
          {WATCH_COMPATIBILITY.map((w) => (
            <Chip key={w.id} active={form.watchCompatibility === w.id} onClick={() => setForm((f) => ({ ...f, watchCompatibility: w.id }))}>
              {w.label}
            </Chip>
          ))}
        </div>
        <span className="mt-1 block text-xs text-text-muted">
          Especialmente importante pra pulseiras — "Não" evita sugerir esse acessório em qualquer look com relógio.
        </span>
      </div>

      <div className="flex gap-2 pt-1">
        <button type="submit" className="flex-1 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-bone transition hover:opacity-90">
          Salvar
        </button>
        {onDelete && (
          <button type="button" onClick={onDelete} className="rounded-full border border-red-500/30 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/10">
            Remover
          </button>
        )}
        <button type="button" onClick={onCancel} className="rounded-full border border-border px-4 py-2.5 text-sm font-medium text-text-muted transition hover:bg-surface-3">
          Cancelar
        </button>
      </div>
    </form>
  )
}

// Mesmo HeartButton de WatchCard.jsx/MeusMoodesScreen.jsx — favoritos de
// acessório reaproveitam o array `favorites` já existente (ver
// storage.toggleFavorite), compartilhado com relógios; id prefixado
// "acc-" evita colisão entre as duas categorias nesse array comum.
function AccessoryHeartButton({ active, onToggle }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
      }}
      aria-label={active ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      aria-pressed={active}
      className="shrink-0 rounded-full p-2 text-text-muted transition hover:text-accent"
    >
      <svg className={`h-4 w-4 ${active ? 'fill-accent text-accent' : 'fill-none'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 20.6l-1.4-1.3C5.4 14.9 2 11.8 2 8.1 2 5.3 4.2 3 7 3c1.6 0 3.1.8 4 2 .9-1.2 2.4-2 4-2 2.8 0 5 2.3 5 5.1 0 3.7-3.4 6.8-8.6 11.2l-1.4 1.3z"
        />
      </svg>
    </button>
  )
}

function AccessoryRow({ accessory, isFavorite, onToggleFavorite, onEdit }) {
  const styleLabel = (accessory.style ?? []).map((s) => ACCESSORY_STYLE_LABEL[s]).filter(Boolean).join(' / ')
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-2/60 p-3">
      <span className="h-9 w-9 shrink-0 rounded-full ring-1 ring-border" style={{ background: accessory.primaryColor }} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-text">{accessoryDisplayName(accessory)}</p>
        <p className="truncate text-xs text-text-muted">
          {ACCESSORY_MATERIAL_LABEL[accessory.material]} · {colorLabel(accessory.primaryColor)}
        </p>
        {styleLabel && <p className="truncate text-[11px] text-text-muted/80">{styleLabel}</p>}
      </div>
      <AccessoryHeartButton active={isFavorite} onToggle={onToggleFavorite} />
      <EditIconButton onClick={onEdit} label={`Editar ${accessoryDisplayName(accessory)}`} />
    </div>
  )
}

// Importação em lote: cola um array [{nome, cor}] (ou já com marca/tipo/
// hexes prontos) e cada item vira um tênis cadastrado. A cor em texto
// livre é traduzida pra paleta do app via matchColorNameToHexes — é uma
// aproximação (jargão de colorway tipo "Solar Flare" não é uma cor
// exata), por isso mostra uma prévia antes de confirmar.
function SneakerImportPanel({ onImport, onCancel }) {
  const [raw, setRaw] = useState('')
  const [parsed, setParsed] = useState(null)
  const [error, setError] = useState(null)

  const handleParse = () => {
    setError(null)
    let data
    try {
      data = JSON.parse(raw)
    } catch {
      setError('JSON inválido — confere se colou a lista certinha.')
      return
    }
    if (!Array.isArray(data) || data.length === 0) {
      setError('Esperado um array de itens, ex: [{"nome": "...", "cor": "..."}].')
      return
    }
    const items = data
      .map((item) => {
        const nome = String(item?.nome ?? '').trim()
        const marca = item?.marca?.trim() || guessBrand(nome)
        const tipo = item?.tipo || 'Tênis'
        const hexes = Array.isArray(item?.hexes) && item.hexes.length > 0 ? item.hexes : matchColorNameToHexes(item?.cor)
        return { nome, marca, tipo, hexes }
      })
      .filter((i) => i.nome)
    if (items.length === 0) {
      setError('Nenhum item com "nome" válido encontrado.')
      return
    }
    setParsed(items)
  }

  if (parsed) {
    return (
      <div className="space-y-4 rounded-2xl border border-border bg-surface-2/60 p-5">
        <p className="text-sm font-semibold text-text">{parsed.length} tênis encontrados</p>
        <p className="text-xs text-text-muted">Confere as cores antes de importar — dá pra ajustar qualquer um depois, individualmente.</p>
        <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
          {parsed.map((item, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 p-2.5">
              <span
                className="h-6 w-6 shrink-0 rounded-full ring-1 ring-border"
                style={{
                  background: item.hexes.length > 1 ? `conic-gradient(${item.hexes[0]} 0% 50%, ${item.hexes[1]} 50% 100%)` : item.hexes[0],
                }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-text">{item.nome}</p>
                <p className="truncate text-[11px] text-text-muted">
                  {colorComboLabel(item.hexes)}
                  {item.marca ? ` · ${item.marca}` : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onImport(parsed)}
            className="flex-1 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-bone transition hover:opacity-90"
          >
            Importar {parsed.length} tênis
          </button>
          <button onClick={() => setParsed(null)} className="rounded-full border border-border px-4 py-2.5 text-sm font-medium text-text-muted transition hover:bg-surface-3">
            Voltar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-surface-2/60 p-5">
      <div>
        <p className="text-sm font-semibold text-text">Importar lista de tênis</p>
        <p className="mt-1 text-xs text-text-muted">
          Cola um array JSON com nome e cor de cada tênis — a cor é traduzida pra paleta do app automaticamente.
        </p>
      </div>
      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        rows={8}
        placeholder='[{"nome": "Air Jordan 1 High", "cor": "Branco/Preto"}, ...]'
        className={`${inputClass} font-mono text-xs`}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button onClick={handleParse} className="flex-1 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-bone transition hover:opacity-90">
          Ler lista
        </button>
        <button onClick={onCancel} className="rounded-full border border-border px-4 py-2.5 text-sm font-medium text-text-muted transition hover:bg-surface-3">
          Cancelar
        </button>
      </div>
    </div>
  )
}

// Mesmo padrão de SneakerImportPanel, mas pra perfumes: cola um array
// [{nome, marca, familia, notas}] e cada item vira um perfume cadastrado.
// Família em texto livre é resolvida via matchFamilyName (correspondência
// exata, sem aproximação por palavra-chave — errar a família muda a
// ocasião inteira que o perfume é sugerido pra, então sem match cai na
// primeira família conhecida, sempre revisável depois no formulário).
function PerfumeImportPanel({ onImport, onCancel }) {
  const [raw, setRaw] = useState('')
  const [parsed, setParsed] = useState(null)
  const [error, setError] = useState(null)

  const handleParse = () => {
    setError(null)
    let data
    try {
      data = JSON.parse(raw)
    } catch {
      setError('JSON inválido — confere se colou a lista certinha.')
      return
    }
    if (!Array.isArray(data) || data.length === 0) {
      setError('Esperado um array de itens, ex: [{"nome": "...", "familia": "..."}].')
      return
    }
    const items = data
      .map((item) => {
        const nome = String(item?.nome ?? '').trim()
        const marca = String(item?.marca ?? '').trim()
        const familia = matchFamilyName(item?.familia) ?? KNOWN_FAMILIES[0]
        const notas = notasFromImportItem(item)
        return { nome, marca, familia, notas }
      })
      .filter((i) => i.nome)
    if (items.length === 0) {
      setError('Nenhum item com "nome" válido encontrado.')
      return
    }
    setParsed(items)
  }

  if (parsed) {
    return (
      <div className="space-y-4 rounded-2xl border border-accent/25 bg-surface-2/60 p-5">
        <p className="text-sm font-semibold text-text">{parsed.length} perfumes encontrados</p>
        <p className="text-xs text-text-muted">Confere a família olfativa e as notas antes de importar — dá pra ajustar qualquer um depois, individualmente.</p>
        <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
          {parsed.map((item, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 p-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10">
                <svg className="h-3.5 w-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 2h6M10 2v3.3c0 .5-.2 1-.55 1.37L7.1 9.2A3 3 0 006 11.4V20a2 2 0 002 2h8a2 2 0 002-2v-8.6a3 3 0 00-1.1-2.2L14.55 6.7A2 2 0 0114 5.3V2" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-text">{item.nome}</p>
                <p className="truncate text-[11px] text-text-muted">
                  {item.marca ? `${item.marca} · ` : ''}
                  {item.familia}
                </p>
                {item.notas && <p className="truncate text-[10px] text-text-muted/80">{item.notas}</p>}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onImport(parsed)}
            className="flex-1 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-bone transition hover:opacity-90"
          >
            Importar {parsed.length} perfumes
          </button>
          <button onClick={() => setParsed(null)} className="rounded-full border border-border px-4 py-2.5 text-sm font-medium text-text-muted transition hover:bg-surface-3">
            Voltar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-2xl border border-accent/25 bg-surface-2/60 p-5">
      <div>
        <p className="text-sm font-semibold text-text">Importar lista de perfumes</p>
        <p className="mt-1 text-xs text-text-muted">
          Cola um array JSON com nome (e opcionalmente marca/família/notas) de cada perfume — a família em texto é
          reconhecida quando bate com uma das famílias que o app já usa, e as notas ajudam a escolher qual perfume
          combina mais com o clima do dia, quando você tiver mais de um da mesma família. Notas em pirâmide olfativa
          (campos "saida"/"coracao"/"fundo", como a maioria dos bancos de dados de perfume exporta) também funcionam
          — não precisa ser um campo "notas" único.
        </p>
      </div>
      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        rows={8}
        placeholder='[{"nome": "Bleu de Chanel EDP", "marca": "Chanel", "familia": "Amadeirado executivo", "notas": "vetiver, cedro, âmbar seco"}, ...]'
        className={`${inputClass} font-mono text-xs`}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button onClick={handleParse} className="flex-1 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-bone transition hover:opacity-90">
          Ler lista
        </button>
        <button onClick={onCancel} className="rounded-full border border-border px-4 py-2.5 text-sm font-medium text-text-muted transition hover:bg-surface-3">
          Cancelar
        </button>
      </div>
    </div>
  )
}

function SneakerRow({ sneaker, onEdit }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-2/60 p-3">
      <ColorSwatch hexes={sneaker.hexes} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-text">{sneaker.nome}</p>
        <p className="truncate text-xs text-text-muted">
          {colorComboLabel(sneaker.hexes)}
          {sneaker.marca ? ` · ${sneaker.marca}` : ''} · {sneaker.tipo}
        </p>
      </div>
      <EditIconButton onClick={onEdit} label={`Editar ${sneaker.nome}`} />
    </div>
  )
}

// "Seu estilo" — sempre recalculado a partir de dados reais (nunca uma
// preferência escrita à mão no código); ver src/lib/userStyleProfile.js.
function StyleInsightsPanel({ insights }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-2/60 p-5">
      <p className="text-sm font-semibold text-text">Seu estilo</p>
      <p className="mt-1 text-xs text-text-muted">Calculado a partir das suas escolhas e feedback — não é uma configuração manual.</p>
      <ul className="mt-4 space-y-2.5">
        {insights.map((text, i) => (
          <li key={i} className="flex gap-2.5 text-sm text-text-muted">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
            {text}
          </li>
        ))}
      </ul>
    </div>
  )
}

function PerfumeRow({ perfume, onEdit }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-2/60 p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10">
        <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 2h6M10 2v3.3c0 .5-.2 1-.55 1.37L7.1 9.2A3 3 0 006 11.4V20a2 2 0 002 2h8a2 2 0 002-2v-8.6a3 3 0 00-1.1-2.2L14.55 6.7A2 2 0 0114 5.3V2" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.2 13.5h9.6" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-text">{perfume.nome}</p>
        <p className="truncate text-xs text-text-muted">
          {perfume.marca ? `${perfume.marca} · ` : ''}
          {perfume.familia}
        </p>
        {perfume.notas && <p className="truncate text-[11px] text-text-muted/80">{perfume.notas}</p>}
      </div>
      <EditIconButton onClick={onEdit} label={`Editar ${perfume.nome}`} />
    </div>
  )
}

export default function WardrobePanel({
  onBack,
  sneakers,
  perfumes,
  accessories,
  styleInsights,
  onAddSneaker,
  onImportSneakers,
  onUpdateSneaker,
  onDeleteSneaker,
  onAddPerfume,
  onImportPerfumes,
  onUpdatePerfume,
  onDeletePerfume,
  onAddAccessory,
  onUpdateAccessory,
  onDeleteAccessory,
  watches,
}) {
  const [tab, setTab] = useState('relogios') // 'relogios' | 'tenis' | 'perfumes' | 'acessorios' | 'estilo'
  const [editingSneaker, setEditingSneaker] = useState(null) // null | 'new' | id
  const [editingPerfume, setEditingPerfume] = useState(null)
  const [editingAccessory, setEditingAccessory] = useState(null)
  const [accessoryTypeFilter, setAccessoryTypeFilter] = useState('todos')
  const [importingSneakers, setImportingSneakers] = useState(false)
  const [importingPerfumes, setImportingPerfumes] = useState(false)

  const closeForms = () => {
    setEditingSneaker(null)
    setEditingPerfume(null)
    setEditingAccessory(null)
    setImportingSneakers(false)
    setImportingPerfumes(false)
  }

  const filteredAccessories = accessoryTypeFilter === 'todos' ? accessories : accessories.filter((a) => a.type === accessoryTypeFilter)

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-16 pt-4">
      {onBack && (
        <button onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </button>
      )}

      <p className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">Acervo</p>
      <h1 className="mt-1 font-serif text-2xl text-text">Meu Acervo</h1>
      <p className="mt-1.5 text-sm text-text-muted">
        Cadastra o que você realmente tem — assim as sugestões apontam pras suas próprias coisas.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Chip
          active={tab === 'relogios'}
          onClick={() => {
            setTab('relogios')
            closeForms()
          }}
        >
          Relógios ({watches.total})
        </Chip>
        <Chip
          active={tab === 'tenis'}
          onClick={() => {
            setTab('tenis')
            closeForms()
          }}
        >
          Tênis ({sneakers.length})
        </Chip>
        <Chip
          active={tab === 'perfumes'}
          onClick={() => {
            setTab('perfumes')
            closeForms()
          }}
        >
          Perfumes ({perfumes.length})
        </Chip>
        <Chip
          active={tab === 'acessorios'}
          onClick={() => {
            setTab('acessorios')
            closeForms()
          }}
        >
          Acessórios ({accessories.length})
        </Chip>
        <Chip
          active={tab === 'estilo'}
          onClick={() => {
            setTab('estilo')
            closeForms()
          }}
        >
          Seu estilo
        </Chip>
      </div>

      <div className="mt-4">
        {tab === 'relogios' ? (
          <div className="space-y-3">
            <ForgottenWatches watches={watches.collection} history={watches.history} onSelectWatch={watches.onSelectWatch} />
            <FilterBar
              query={watches.query}
              onQueryChange={watches.onQueryChange}
              colorFilter={watches.colorFilter}
              onColorChange={watches.onColorChange}
              typeFilter={watches.typeFilter}
              onTypeChange={watches.onTypeChange}
              brandFilter={watches.brandFilter}
              onBrandChange={watches.onBrandChange}
              brands={watches.brands}
              materialFilter={watches.materialFilter}
              onMaterialChange={watches.onMaterialChange}
              favoritesOnly={watches.favoritesOnly}
              onFavoritesOnlyChange={watches.onFavoritesOnlyChange}
              sortBy={watches.sortBy}
              onSortChange={watches.onSortChange}
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-text-muted">
                {watches.filtered.length} {watches.filtered.length === 1 ? 'relógio' : 'relógios'}
              </p>
              <button
                onClick={watches.onAddWatch}
                className="shrink-0 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-bone transition hover:opacity-90"
              >
                + Adicionar relógio
              </button>
            </div>
            {watches.filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-text">
                  {watches.favoritesOnly ? 'Ainda sem favoritos' : 'Nada por aqui'}
                </p>
                <p className="mt-1.5 text-sm text-text-muted">
                  {watches.favoritesOnly ? 'Favorite um relógio pra ele aparecer aqui.' : 'Ajuste os filtros ou a busca pra ver seus relógios.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {watches.filtered.map((w) => (
                  <WatchCard
                    key={w.id}
                    watch={w}
                    onClick={() => watches.onSelectWatch(w.id)}
                    isFavorite={watches.favorites.includes(w.id)}
                    onToggleFavorite={() => watches.onToggleFavorite(w.id)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : tab === 'tenis' ? (
          importingSneakers ? (
            <SneakerImportPanel
              onImport={(items) => {
                onImportSneakers(items)
                setImportingSneakers(false)
              }}
              onCancel={() => setImportingSneakers(false)}
            />
          ) : editingSneaker !== null ? (
            <SneakerForm
              initial={editingSneaker === 'new' ? null : sneakers.find((s) => s.id === editingSneaker)}
              onSave={(data) => {
                if (editingSneaker === 'new') onAddSneaker(data)
                else onUpdateSneaker(editingSneaker, data)
                setEditingSneaker(null)
              }}
              onCancel={() => setEditingSneaker(null)}
              onDelete={
                editingSneaker === 'new'
                  ? null
                  : () => {
                      onDeleteSneaker(editingSneaker)
                      setEditingSneaker(null)
                    }
              }
            />
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingSneaker('new')}
                  className="flex-1 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-bone transition hover:opacity-90"
                >
                  + Adicionar tênis
                </button>
                <button
                  onClick={() => setImportingSneakers(true)}
                  className="rounded-full border border-border bg-surface-2 px-4 py-2.5 text-sm font-medium text-text-muted transition hover:bg-surface-3"
                >
                  Importar lista
                </button>
              </div>
              {sneakers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wide text-text">Ainda sem tênis</p>
                  <p className="mt-1.5 text-sm text-text-muted">Adicione seus pares para deixar seus MOODEs mais completos.</p>
                </div>
              ) : (
                sneakers.map((s) => <SneakerRow key={s.id} sneaker={s} onEdit={() => setEditingSneaker(s.id)} />)
              )}
            </div>
          )
        ) : tab === 'estilo' ? (
          <StyleInsightsPanel insights={styleInsights} />
        ) : tab === 'acessorios' ? (
          editingAccessory !== null ? (
            <AccessoryForm
              initial={editingAccessory === 'new' ? null : accessories.find((a) => a.id === editingAccessory)}
              onSave={(data) => {
                if (editingAccessory === 'new') onAddAccessory(data)
                else onUpdateAccessory(editingAccessory, data)
                setEditingAccessory(null)
              }}
              onCancel={() => setEditingAccessory(null)}
              onDelete={
                editingAccessory === 'new'
                  ? null
                  : () => {
                      onDeleteAccessory(editingAccessory)
                      setEditingAccessory(null)
                    }
              }
            />
          ) : (
            <div className="space-y-3">
              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [mask-image:linear-gradient(to_right,transparent,black_16px,black_calc(100%-16px),transparent)]">
                <Chip active={accessoryTypeFilter === 'todos'} onClick={() => setAccessoryTypeFilter('todos')}>
                  Todos
                </Chip>
                {ACCESSORY_TYPES.map((t) => (
                  <Chip key={t.id} active={accessoryTypeFilter === t.id} onClick={() => setAccessoryTypeFilter(t.id)}>
                    {t.label}
                  </Chip>
                ))}
              </div>
              <button
                onClick={() => setEditingAccessory('new')}
                className="w-full rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-bone transition hover:opacity-90"
              >
                + Adicionar acessório
              </button>
              {filteredAccessories.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wide text-text">
                    {accessories.length === 0 ? 'Ainda sem acessórios' : 'Nada por aqui'}
                  </p>
                  <p className="mt-1.5 text-sm text-text-muted">
                    {accessories.length === 0
                      ? 'Pulseira, colar, óculos, cinto... qualquer coisa que enriquece o look sem dominar ele.'
                      : 'Ajuste o filtro pra ver seus acessórios.'}
                  </p>
                </div>
              ) : (
                filteredAccessories.map((a) => (
                  <AccessoryRow
                    key={a.id}
                    accessory={a}
                    isFavorite={watches.favorites.includes(a.id)}
                    onToggleFavorite={() => watches.onToggleFavorite(a.id)}
                    onEdit={() => setEditingAccessory(a.id)}
                  />
                ))
              )}
            </div>
          )
        ) : importingPerfumes ? (
          <PerfumeImportPanel
            onImport={(items) => {
              onImportPerfumes(items)
              setImportingPerfumes(false)
            }}
            onCancel={() => setImportingPerfumes(false)}
          />
        ) : editingPerfume !== null ? (
          <PerfumeForm
            initial={editingPerfume === 'new' ? null : perfumes.find((p) => p.id === editingPerfume)}
            onSave={(data) => {
              if (editingPerfume === 'new') onAddPerfume(data)
              else onUpdatePerfume(editingPerfume, data)
              setEditingPerfume(null)
            }}
            onCancel={() => setEditingPerfume(null)}
            onDelete={
              editingPerfume === 'new'
                ? null
                : () => {
                    onDeletePerfume(editingPerfume)
                    setEditingPerfume(null)
                  }
            }
          />
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <button
                onClick={() => setEditingPerfume('new')}
                className="flex-1 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-bone transition hover:opacity-90"
              >
                + Adicionar perfume
              </button>
              <button
                onClick={() => setImportingPerfumes(true)}
                className="rounded-full border border-border bg-surface-2 px-4 py-2.5 text-sm font-medium text-text-muted transition hover:bg-surface-3"
              >
                Importar lista
              </button>
            </div>
            {perfumes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-text">Ainda sem perfumes</p>
                <p className="mt-1.5 text-sm text-text-muted">Seu perfume também muda o MOODE.</p>
              </div>
            ) : (
              perfumes.map((p) => <PerfumeRow key={p.id} perfume={p} onEdit={() => setEditingPerfume(p.id)} />)
            )}
          </div>
        )}
      </div>
    </div>
  )
}
