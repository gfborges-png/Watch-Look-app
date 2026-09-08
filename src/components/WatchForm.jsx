import { useState } from 'react'

const COLOR_CATEGORIES = [
  { value: 'quente', label: 'Quente (dourado, champagne, salmon, whisky)' },
  { value: 'frio', label: 'Frio (azul, turquesa, verde água)' },
  { value: 'terroso', label: 'Terroso (verde oliva, verde escuro)' },
  { value: 'neutro', label: 'Neutro (preto, branco, prata)' },
  { value: 'misto', label: 'Misto (duas cores opostas no mostrador)' },
  { value: 'neutro-quente', label: 'Neutro com toque quente' },
  { value: 'neutro-frio', label: 'Neutro com toque frio' },
]

const BLANK = {
  nome: '',
  marca: '',
  mostrador: '',
  pulseira: '',
  pulseiraAlt: '',
  estilo: '',
  cor: 'neutro',
  accent: '',
  hexes: ['#8C8C8C'],
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

const inputClass =
  'w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-amber-400/60 focus:outline-none'

export default function WatchForm({ mode, initialWatch, onSave, onCancel, onDelete }) {
  const [form, setForm] = useState(() => {
    if (!initialWatch) return BLANK
    // pulseiraAlt/accent podem vir null do storage — normaliza pra string
    // controlada, senão os .trim() do submit e os inputs quebram.
    return { ...BLANK, ...initialWatch, pulseiraAlt: initialWatch.pulseiraAlt ?? '', accent: initialWatch.accent ?? '' }
  })
  const [error, setError] = useState(null)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const setHex = (index, value) =>
    setForm((f) => ({ ...f, hexes: f.hexes.map((h, i) => (i === index ? value : h)) }))
  const addHex = () => setForm((f) => (f.hexes.length >= 3 ? f : { ...f, hexes: [...f.hexes, '#8C8C8C'] }))
  const removeHex = (index) =>
    setForm((f) => (f.hexes.length <= 1 ? f : { ...f, hexes: f.hexes.filter((_, i) => i !== index) }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.nome.trim() || !form.mostrador.trim() || !form.estilo.trim()) {
      setError('Preenche pelo menos nome, mostrador e estilo.')
      return
    }
    onSave({
      ...form,
      nome: form.nome.trim(),
      marca: form.marca.trim(),
      mostrador: form.mostrador.trim(),
      pulseira: form.pulseira.trim(),
      pulseiraAlt: form.pulseiraAlt.trim() || null,
      estilo: form.estilo.trim(),
      accent: form.accent.trim() || null,
    })
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-16 pt-4">
      <button
        onClick={onCancel}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-400 hover:text-neutral-100"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Cancelar
      </button>

      <h1 className="text-lg font-bold text-neutral-50">
        {mode === 'new' ? 'Adicionar relógio' : 'Editar relógio'}
      </h1>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4 rounded-2xl border border-white/10 bg-neutral-900/60 p-5">
        <Field label="Nome" required>
          <input className={inputClass} value={form.nome} onChange={set('nome')} placeholder="Ex: Rolex Explorer II" />
        </Field>
        <Field label="Marca">
          <input className={inputClass} value={form.marca} onChange={set('marca')} placeholder="Ex: Rolex" />
        </Field>
        <Field label="Mostrador" required>
          <input className={inputClass} value={form.mostrador} onChange={set('mostrador')} placeholder="Ex: Preto com ponteiro laranja" />
        </Field>
        <Field label="Pulseira">
          <input className={inputClass} value={form.pulseira} onChange={set('pulseira')} placeholder="Ex: Bracelet aço Oyster" />
        </Field>
        <Field label="Pulseira alternativa">
          <input className={inputClass} value={form.pulseiraAlt ?? ''} onChange={set('pulseiraAlt')} placeholder="Opcional" />
        </Field>
        <Field label="Estilo" required>
          <input className={inputClass} value={form.estilo} onChange={set('estilo')} placeholder="Ex: Sport-explorer aventureiro" />
          <span className="mt-1 block text-xs text-neutral-600">
            Palavras como dress/sport/casual/racing/diver ativam os filtros de estilo.
          </span>
        </Field>
        <Field label="Cor dominante" required>
          <select
            className={inputClass}
            value={form.cor}
            onChange={set('cor')}
          >
            {COLOR_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Cor de destaque">
          <input className={inputClass} value={form.accent ?? ''} onChange={set('accent')} placeholder="Ex: laranja (usado nas sugestões)" />
        </Field>

        <div>
          <span className="mb-1 block text-xs uppercase tracking-wide text-neutral-500">
            Cores do mostrador (até 3) <span className="text-amber-400">*</span>
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {form.hexes.map((hex, i) => (
              <div key={i} className="flex items-center gap-1">
                <input
                  type="color"
                  value={hex}
                  onChange={(e) => setHex(i, e.target.value)}
                  className="h-9 w-9 cursor-pointer rounded-lg border border-white/10 bg-transparent p-0.5"
                />
                {form.hexes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeHex(i)}
                    className="text-xs text-neutral-500 hover:text-red-400"
                    aria-label="Remover cor"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            {form.hexes.length < 3 && (
              <button
                type="button"
                onClick={addHex}
                className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-neutral-300 hover:bg-white/10"
              >
                + cor
              </button>
            )}
          </div>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            className="flex-1 rounded-full bg-amber-400 px-4 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-amber-300"
          >
            Salvar
          </button>
          {mode === 'edit' && (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-full border border-red-500/30 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
            >
              Remover
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
