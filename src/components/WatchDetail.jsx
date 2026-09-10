import ColorSwatch from './ColorSwatch.jsx'
import { COLOR_LABELS, generateLooks } from '../lib/outfitEngine.js'
import { daysSince } from '../lib/storage.js'
import { suggestPerfume } from '../lib/perfumeEngine.js'
import { usageStats, rotationLevel } from '../lib/rotationEngine.js'

const ROTATION_LABEL = { baixa: 'Baixa', média: 'Média', alta: 'Alta' }

function LookPiece({ label, value }) {
  if (!value) return null
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border py-2 last:border-0">
      <span className="text-xs uppercase tracking-wide text-text-muted">{label}</span>
      <span className="text-right text-sm text-text">{value}</span>
    </div>
  )
}

// Sem clima ao vivo aqui (isso só existe em Look → Relógio) — a ocasião de
// cada bloco de look já basta pra dar um perfil de perfume coerente.
function contextoToOcasiao(contexto) {
  if (contexto.startsWith('Trabalho')) return 'trabalho'
  if (contexto.startsWith('Casual')) return 'casual'
  return 'fimDeSemana'
}

function lastWornLabel(dateStr) {
  if (!dateStr) return null
  const days = daysSince(dateStr)
  if (days === 0) return 'Você usou esse hoje'
  if (days === 1) return 'Você usou esse ontem'
  return `Você usou esse há ${days} dias`
}

export default function WatchDetail({ watch, onBack, isFavorite, onToggleFavorite, lastWorn, history, onLogWornToday, onEdit, onDelete, onBuildAroundThis }) {
  const looks = generateLooks(watch)
  const wornLabel = lastWornLabel(lastWorn)
  const stats = history ? usageStats(watch.id, history) : null
  const rotation = history ? rotationLevel(watch.id, history) : null

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-16 pt-4">
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Voltar ao acervo
      </button>

      <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface-2/60 p-5">
        <ColorSwatch hexes={watch.hexes} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-accent">{watch.marca}</p>
          <h1 className="mt-0.5 text-lg font-bold text-text">{watch.nome}</h1>
          <p className="mt-1 text-sm text-text-muted">{watch.estilo}</p>
        </div>
      </div>

      {stats && (
        <div className="mt-3 grid grid-cols-4 gap-2 rounded-2xl border border-border bg-surface-2/60 p-4 text-center">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-text-muted">Último uso</p>
            <p className="mt-1 text-sm font-semibold text-text">{wornLabel ? wornLabel.replace('Você usou esse ', '') : '—'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-text-muted">30 dias</p>
            <p className="mt-1 text-sm font-semibold text-text">{stats.uses30}×</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-text-muted">90 dias</p>
            <p className="mt-1 text-sm font-semibold text-text">{stats.uses90}×</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-text-muted">Rotação</p>
            <p className="mt-1 text-sm font-semibold text-text">{ROTATION_LABEL[rotation] ?? '—'}</p>
          </div>
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          onClick={onLogWornToday}
          className="rounded-full bg-accent px-3 py-2.5 text-xs font-semibold text-bone transition hover:opacity-90"
        >
          Usar hoje
        </button>
        <button
          onClick={onToggleFavorite}
          aria-pressed={isFavorite}
          className={`rounded-full border px-3 py-2.5 text-xs font-semibold transition ${
            isFavorite ? 'border-accent/40 bg-accent/10 text-accent' : 'border-border bg-surface-2 text-text-muted hover:bg-surface-3'
          }`}
        >
          {isFavorite ? '★ Favoritado' : 'Favoritar'}
        </button>
        <button
          onClick={onBuildAroundThis}
          className="col-span-2 rounded-full border border-border bg-surface-2 px-3 py-2.5 text-xs font-semibold text-text transition hover:bg-surface-3"
        >
          Montar um MOODE com isso
        </button>
        <button
          onClick={onEdit}
          className="rounded-full border border-border bg-surface-2 px-3 py-2 text-xs font-medium text-text-muted transition hover:bg-surface-3"
        >
          Editar
        </button>
        <button
          onClick={onDelete}
          className="rounded-full border border-red-500/30 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/10"
        >
          Remover
        </button>
      </div>

      <section className="mt-5 rounded-2xl border border-border bg-surface-2/60 p-5">
        <h2 className="text-sm font-semibold text-text">Especificações</h2>
        <div className="mt-2">
          <LookPiece label="Marca" value={watch.marca} />
          <LookPiece label="Mostrador" value={watch.mostrador} />
          <LookPiece label="Pulseira" value={watch.pulseira} />
          <LookPiece label="Pulseira alternativa" value={watch.pulseiraAlt} />
          <LookPiece label="Estilo" value={watch.estilo} />
          <LookPiece label="Cor dominante" value={COLOR_LABELS[watch.cor]} />
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-text">Sugestões de look</h2>
        <p className="mt-1 text-xs text-text-muted">
          Baseado na lógica de combinação de cores para o mostrador {watch.mostrador.toLowerCase()}.
        </p>

        <div className="mt-4 space-y-4">
          {looks.map((look) => {
            const perfume = suggestPerfume({ weatherBias: null, context: contextoToOcasiao(look.contexto) })
            return (
              <div key={look.contexto} className="rounded-2xl border border-border bg-surface-2/60 p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-text">{look.contexto}</h3>
                </div>
                <div className="mt-3">
                  <LookPiece label="Camisa/camiseta" value={look.top} />
                  <LookPiece label="Calça" value={look.bottom} />
                  <LookPiece label="Tênis/sapato" value={look.tenis} />
                  <LookPiece label="Camada extra" value={look.camadaExtra} />
                </div>
                <p className="mt-3 rounded-xl bg-surface-2 p-3 text-xs leading-relaxed text-text-muted">
                  {look.porque}
                </p>
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-accent/25 bg-accent/5 p-3">
                  <svg className="h-4 w-4 shrink-0 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 2h6M10 2v3.3c0 .5-.2 1-.55 1.37L7.1 9.2A3 3 0 006 11.4V20a2 2 0 002 2h8a2 2 0 002-2v-8.6a3 3 0 00-1.1-2.2L14.55 6.7A2 2 0 0114 5.3V2" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.2 13.5h9.6" />
                  </svg>
                  <p className="min-w-0 text-xs text-text-muted">
                    <span className="font-semibold text-accent">{perfume.familia}</span>
                    <span className="text-text-muted"> — {perfume.descritores.slice(0, 2).join(', ')} · ref: {perfume.referencias[0]}</span>
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
