import { CONTEXTS } from '../../lib/matchEngine.js'
import { weatherSummaryParts } from '../../lib/weather.js'
import { Chip } from '../FilterBar.jsx'

export default function WeatherOccasionPanel({ weather, onFetchWeather, context, onContextChange }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-2/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text">Clima de hoje</p>
          {weather.status === 'ready' && (
            <p className="mt-0.5 text-xs text-text-muted">
              {weatherSummaryParts(weather).join(' · ')} —{' '}
              {weather.bias === 'ameno'
                ? 'temperatura amena, então relógio e perfume seguem só pelo look e ocasião'
                : `puxando a sugestão pra mostradores e perfume mais ${weather.bias === 'quente' ? 'claros' : 'quentes'}`}
            </p>
          )}
          {weather.status === 'error' && <p className="mt-0.5 text-xs text-red-400">{weather.error}</p>}
          {weather.status === 'idle' && (
            <p className="mt-0.5 text-xs text-text-muted">Ajusta o relógio e o perfume sugeridos pro clima real de hoje</p>
          )}
        </div>
        <button
          onClick={onFetchWeather}
          disabled={weather.status === 'loading'}
          className="shrink-0 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-bone transition hover:opacity-90 disabled:opacity-60"
        >
          {weather.status === 'loading' ? 'Buscando...' : weather.status === 'ready' ? 'Atualizar' : 'Usar clima de hoje'}
        </button>
      </div>

      <div className="mt-3 border-t border-border pt-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Ocasião</p>
        <div className="flex flex-wrap gap-2">
          {CONTEXTS.map((ctx) => (
            <Chip key={ctx.id} active={context === ctx.id} onClick={() => onContextChange(ctx.id)}>
              {ctx.label}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  )
}
