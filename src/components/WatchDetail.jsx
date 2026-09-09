import ColorSwatch from './ColorSwatch.jsx'
import { COLOR_LABELS, generateLooks } from '../lib/outfitEngine.js'
import { daysSince } from '../lib/storage.js'
import { suggestPerfume } from '../lib/perfumeEngine.js'

function LookPiece({ label, value }) {
  if (!value) return null
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-white/5 py-2 last:border-0">
      <span className="text-xs uppercase tracking-wide text-neutral-500">{label}</span>
      <span className="text-right text-sm text-neutral-200">{value}</span>
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

export default function WatchDetail({ watch, onBack, isFavorite, onToggleFavorite, lastWorn, onLogWornToday, onEdit, onDelete }) {
  const looks = generateLooks(watch)
  const wornLabel = lastWornLabel(lastWorn)

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-16 pt-4">
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-400 hover:text-neutral-100"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Voltar à coleção
      </button>

      <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-neutral-900/60 p-5">
        <ColorSwatch hexes={watch.hexes} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-400">{watch.marca}</p>
          <h1 className="mt-0.5 text-lg font-bold text-neutral-50">{watch.nome}</h1>
          <p className="mt-1 text-sm text-neutral-400">{watch.estilo}</p>
        </div>
        <button
          onClick={onToggleFavorite}
          aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          aria-pressed={isFavorite}
          className="shrink-0 rounded-full p-1.5 text-neutral-500 transition hover:text-amber-400"
        >
          <svg
            className={`h-6 w-6 ${isFavorite ? 'fill-amber-400 text-amber-400' : 'fill-none'}`}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 20.6l-1.4-1.3C5.4 14.9 2 11.8 2 8.1 2 5.3 4.2 3 7 3c1.6 0 3.1.8 4 2 .9-1.2 2.4-2 4-2 2.8 0 5 2.3 5 5.1 0 3.7-3.4 6.8-8.6 11.2l-1.4 1.3z"
            />
          </svg>
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-neutral-900/60 px-4 py-3">
        <p className="text-xs text-neutral-400">{wornLabel ?? 'Você ainda não registrou ter usado esse relógio'}</p>
        <button
          onClick={onLogWornToday}
          className="shrink-0 rounded-full bg-amber-400 px-3 py-1.5 text-xs font-semibold text-neutral-950 transition hover:bg-amber-300"
        >
          Usei hoje
        </button>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={onEdit}
          className="flex-1 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-neutral-300 transition hover:bg-white/10"
        >
          Editar relógio
        </button>
        <button
          onClick={onDelete}
          className="flex-1 rounded-full border border-red-500/30 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/10"
        >
          Remover da coleção
        </button>
      </div>

      <section className="mt-5 rounded-2xl border border-white/10 bg-neutral-900/60 p-5">
        <h2 className="text-sm font-semibold text-neutral-100">Especificações</h2>
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
        <h2 className="text-sm font-semibold text-neutral-100">Sugestões de look</h2>
        <p className="mt-1 text-xs text-neutral-500">
          Baseado na lógica de combinação de cores para o mostrador {watch.mostrador.toLowerCase()}.
        </p>

        <div className="mt-4 space-y-4">
          {looks.map((look) => {
            const perfume = suggestPerfume({ weatherBias: null, context: contextoToOcasiao(look.contexto) })
            return (
              <div key={look.contexto} className="rounded-2xl border border-white/10 bg-neutral-900/60 p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-neutral-50">{look.contexto}</h3>
                </div>
                <div className="mt-3">
                  <LookPiece label="Camisa/camiseta" value={look.top} />
                  <LookPiece label="Calça" value={look.bottom} />
                  <LookPiece label="Tênis/sapato" value={look.tenis} />
                  <LookPiece label="Camada extra" value={look.camadaExtra} />
                </div>
                <p className="mt-3 rounded-xl bg-black/30 p-3 text-xs leading-relaxed text-neutral-400">
                  {look.porque}
                </p>
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3">
                  <svg className="h-4 w-4 shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 2h6M10 2v3.3c0 .5-.2 1-.55 1.37L7.1 9.2A3 3 0 006 11.4V20a2 2 0 002 2h8a2 2 0 002-2v-8.6a3 3 0 00-1.1-2.2L14.55 6.7A2 2 0 0114 5.3V2" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.2 13.5h9.6" />
                  </svg>
                  <p className="min-w-0 text-xs text-neutral-300">
                    <span className="font-semibold text-amber-400">{perfume.familia}</span>
                    <span className="text-neutral-500"> — {perfume.descritores.slice(0, 2).join(', ')} · ref: {perfume.referencias[0]}</span>
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
