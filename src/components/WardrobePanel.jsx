import { useState } from 'react'
import { GARMENTS, LOOK_COLORS } from '../lib/matchEngine.js'
import { KNOWN_FAMILIES } from '../lib/perfumeEngine.js'
import { matchColorNameToHexes, guessBrand } from '../lib/colorNameMatch.js'
import { Chip } from './FilterBar.jsx'
import ColorSwatch from './ColorSwatch.jsx'

const inputClass =
  'w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-amber-400/60 focus:outline-none'

const SNEAKER_TIPOS = GARMENTS.find((g) => g.key === 'calcado').tipos
const BLANK_SNEAKER = { nome: '', marca: '', tipo: 'Tênis', hexes: ['#F5F3EE'] }
const BLANK_PERFUME = { nome: '', marca: '', familia: KNOWN_FAMILIES[0], notas: '' }

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
            className={`relative h-7 w-7 shrink-0 rounded-full ring-2 transition ${
              active ? 'ring-amber-400 scale-110' : 'ring-transparent hover:ring-white/30'
            }`}
            style={{ background: c.hex }}
          >
            {active && hexes.length === 2 && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-400 text-[9px] font-bold leading-none text-neutral-950">
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
      <span className="mb-1 block text-xs uppercase tracking-wide text-neutral-500">
        {label} {required && <span className="text-amber-400">*</span>}
      </span>
      {children}
    </label>
  )
}

function EditIconButton({ onClick, label }) {
  return (
    <button onClick={onClick} aria-label={label} className="rounded-full p-1.5 text-neutral-500 transition hover:bg-white/10 hover:text-neutral-200">
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
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-neutral-900/60 p-5">
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
        <span className="mb-1 block text-xs uppercase tracking-wide text-neutral-500">
          Cor (até 2) <span className="text-amber-400">*</span>
        </span>
        <SneakerColorPicker hexes={form.hexes} onChange={(hexes) => setForm((f) => ({ ...f, hexes }))} />
        <p className="mt-1.5 text-xs text-neutral-500">
          {colorComboLabel(form.hexes)}
          {form.hexes.length < 2 && ' — toca em outra cor pra fazer uma combinação (ex: Branco com Azul)'}
        </p>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button type="submit" className="flex-1 rounded-full bg-amber-400 px-4 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-amber-300">
          Salvar
        </button>
        {onDelete && (
          <button type="button" onClick={onDelete} className="rounded-full border border-red-500/30 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/10">
            Remover
          </button>
        )}
        <button type="button" onClick={onCancel} className="rounded-full border border-white/10 px-4 py-2.5 text-sm font-medium text-neutral-300 transition hover:bg-white/10">
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
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-amber-400/20 bg-neutral-900/60 p-5">
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
        <span className="mt-1 block text-xs text-neutral-600">
          É essa família que decide quando esse perfume vira sugestão pra um clima/ocasião.
        </span>
      </Field>
      <Field label="Notas">
        <input className={inputClass} value={form.notas} onChange={set('notas')} placeholder="Ex: bergamota, cedro, almíscar (opcional)" />
      </Field>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button type="submit" className="flex-1 rounded-full bg-amber-400 px-4 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-amber-300">
          Salvar
        </button>
        {onDelete && (
          <button type="button" onClick={onDelete} className="rounded-full border border-red-500/30 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/10">
            Remover
          </button>
        )}
        <button type="button" onClick={onCancel} className="rounded-full border border-white/10 px-4 py-2.5 text-sm font-medium text-neutral-300 transition hover:bg-white/10">
          Cancelar
        </button>
      </div>
    </form>
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
      <div className="space-y-4 rounded-2xl border border-white/10 bg-neutral-900/60 p-5">
        <p className="text-sm font-semibold text-neutral-100">{parsed.length} tênis encontrados</p>
        <p className="text-xs text-neutral-500">Confere as cores antes de importar — dá pra ajustar qualquer um depois, individualmente.</p>
        <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
          {parsed.map((item, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-2.5">
              <span
                className="h-6 w-6 shrink-0 rounded-full ring-1 ring-white/20"
                style={{
                  background: item.hexes.length > 1 ? `conic-gradient(${item.hexes[0]} 0% 50%, ${item.hexes[1]} 50% 100%)` : item.hexes[0],
                }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-neutral-100">{item.nome}</p>
                <p className="truncate text-[11px] text-neutral-500">
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
            className="flex-1 rounded-full bg-amber-400 px-4 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-amber-300"
          >
            Importar {parsed.length} tênis
          </button>
          <button onClick={() => setParsed(null)} className="rounded-full border border-white/10 px-4 py-2.5 text-sm font-medium text-neutral-300 transition hover:bg-white/10">
            Voltar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-neutral-900/60 p-5">
      <div>
        <p className="text-sm font-semibold text-neutral-100">Importar lista de tênis</p>
        <p className="mt-1 text-xs text-neutral-500">
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
        <button onClick={handleParse} className="flex-1 rounded-full bg-amber-400 px-4 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-amber-300">
          Ler lista
        </button>
        <button onClick={onCancel} className="rounded-full border border-white/10 px-4 py-2.5 text-sm font-medium text-neutral-300 transition hover:bg-white/10">
          Cancelar
        </button>
      </div>
    </div>
  )
}

function SneakerRow({ sneaker, onEdit }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-neutral-900/60 p-3">
      <ColorSwatch hexes={sneaker.hexes} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-neutral-100">{sneaker.nome}</p>
        <p className="truncate text-xs text-neutral-500">
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
    <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-5">
      <p className="text-sm font-semibold text-neutral-100">Seu estilo</p>
      <p className="mt-1 text-xs text-neutral-500">Calculado a partir das suas escolhas e feedback — não é uma configuração manual.</p>
      <ul className="mt-4 space-y-2.5">
        {insights.map((text, i) => (
          <li key={i} className="flex gap-2.5 text-sm text-neutral-300">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
            {text}
          </li>
        ))}
      </ul>
    </div>
  )
}

function PerfumeRow({ perfume, onEdit }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-neutral-900/60 p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400/10">
        <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 2h6M10 2v3.3c0 .5-.2 1-.55 1.37L7.1 9.2A3 3 0 006 11.4V20a2 2 0 002 2h8a2 2 0 002-2v-8.6a3 3 0 00-1.1-2.2L14.55 6.7A2 2 0 0114 5.3V2" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.2 13.5h9.6" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-neutral-100">{perfume.nome}</p>
        <p className="truncate text-xs text-neutral-500">
          {perfume.marca ? `${perfume.marca} · ` : ''}
          {perfume.familia}
        </p>
      </div>
      <EditIconButton onClick={onEdit} label={`Editar ${perfume.nome}`} />
    </div>
  )
}

export default function WardrobePanel({
  onBack,
  sneakers,
  perfumes,
  styleInsights,
  onAddSneaker,
  onImportSneakers,
  onUpdateSneaker,
  onDeleteSneaker,
  onAddPerfume,
  onUpdatePerfume,
  onDeletePerfume,
}) {
  const [tab, setTab] = useState('tenis') // 'tenis' | 'perfumes'
  const [editingSneaker, setEditingSneaker] = useState(null) // null | 'new' | id
  const [editingPerfume, setEditingPerfume] = useState(null)
  const [importingSneakers, setImportingSneakers] = useState(false)

  const closeForms = () => {
    setEditingSneaker(null)
    setEditingPerfume(null)
    setImportingSneakers(false)
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-16 pt-4">
      {onBack && (
        <button onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-400 hover:text-neutral-100">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </button>
      )}

      <h1 className="text-lg font-bold text-neutral-50">Guarda-roupa</h1>
      <p className="mt-1 text-sm text-neutral-400">
        Cadastra o que você realmente tem — assim as sugestões de tênis e perfume apontam pras suas próprias coisas.
      </p>

      <div className="mt-4 flex gap-2">
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
        {tab === 'tenis' ? (
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
                  className="flex-1 rounded-full bg-amber-400 px-4 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-amber-300"
                >
                  + Adicionar tênis
                </button>
                <button
                  onClick={() => setImportingSneakers(true)}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-neutral-300 transition hover:bg-white/10"
                >
                  Importar lista
                </button>
              </div>
              {sneakers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-neutral-500">
                  Nenhum tênis cadastrado ainda.
                </div>
              ) : (
                sneakers.map((s) => <SneakerRow key={s.id} sneaker={s} onEdit={() => setEditingSneaker(s.id)} />)
              )}
            </div>
          )
        ) : tab === 'estilo' ? (
          <StyleInsightsPanel insights={styleInsights} />
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
            <button
              onClick={() => setEditingPerfume('new')}
              className="w-full rounded-full bg-amber-400 px-4 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-amber-300"
            >
              + Adicionar perfume
            </button>
            {perfumes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-neutral-500">
                Nenhum perfume cadastrado ainda.
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
