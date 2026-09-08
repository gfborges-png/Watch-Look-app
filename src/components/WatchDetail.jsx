import ColorSwatch from './ColorSwatch.jsx'
import { COLOR_LABELS, generateLooks } from '../lib/outfitEngine.js'
import { daysSince } from '../lib/storage.js'

function LookPiece({ label, value }) {
  if (!value) return null
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-white/5 py-2 last:border-0">
      <span className="text-xs uppercase tracking-wide text-neutral-500">{label}</span>
      <span className="text-right text-sm text-neutral-200">{value}</span>
    </div>
  )
}

function lastWornLabel(dateStr) {
  if (!dateStr) return null
  const days = daysSince(dateStr)
  if (days === 0) return 'Você usou esse hoje'
  if (days === 1) return 'Você usou esse ontem'
  return `Você usou esse há ${days} dias`
}

export default function WatchDetail({ watch, onBack, isFavorite, onToggleFavorite, lastWorn, onLogWornToday }) {
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
          {looks.map((look) => (
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
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
