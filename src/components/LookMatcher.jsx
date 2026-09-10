import { useMemo } from 'react'
import { GARMENTS } from '../lib/matchEngine.js'
import { recommendWatchesForLook } from '../lib/recommendationEngine.js'
import LookInputSection from './look/LookInputSection.jsx'
import WeatherOccasionPanel from './look/WeatherOccasionPanel.jsx'
import PerfumeRecommendation from './look/PerfumeRecommendation.jsx'
import MatchResults from './look/MatchResults.jsx'
import ChoiceFeedback from './look/ChoiceFeedback.jsx'
import VibePicker from './ds/VibePicker.jsx'

// Orquestrador do fluxo Look → Relógio: cada responsabilidade (entrada do
// look, clima/ocasião, perfume, resultados, feedback) mora no seu próprio
// componente em ./look — aqui só liga os dados entre eles.
export default function LookMatcher({
  watches,
  onSelectWatch,
  outfit,
  onOutfitChange,
  context,
  onContextChange,
  vibeId,
  onVibeChange,
  history,
  favorites,
  onToggleFavorite,
  weather,
  onFetchWeather,
  bias,
  onLogChoice,
  onLogFeedback,
  sneakers,
  perfumes,
  accessories,
  lockedWatchId,
  onUnlockWatch,
}) {
  const weatherBias = weather.status === 'ready' ? weather.bias : null
  const results = useMemo(
    () => recommendWatchesForLook(watches, outfit, context, { weatherBias, history, personalBias: bias, vibeId }),
    [watches, outfit, context, history, weatherBias, bias, vibeId],
  )

  const hasSelection = GARMENTS.some((g) => {
    const piece = outfit[g.key]
    return (!g.optional || piece.enabled) && piece.colorId
  })
  // Um relógio "travado" (via "Montar um MOODE com isso" no detalhe do
  // item) restringe só o resultado final a ele — o resto do fluxo
  // (peças, clima, ocasião) continua igual, e ChoiceFeedback ainda lista
  // a coleção inteira, já que é sobre o que você realmente acabou usando.
  const lockedResult = lockedWatchId ? results.find((r) => r.watch.id === lockedWatchId) : null
  const topResults = !hasSelection ? [] : lockedResult ? [lockedResult] : results.slice(0, 5)

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">Montar</p>
        <h1 className="mt-1 font-serif text-2xl text-text">Montar um MOODE</h1>
      </div>

      {lockedResult && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3">
          <p className="text-xs text-text">
            🔒 <span className="font-semibold">{lockedResult.watch.nome}</span> — vamos montar o restante em torno disso.
          </p>
          <button onClick={onUnlockWatch} className="shrink-0 text-[11px] font-medium text-accent hover:underline">
            usar outro
          </button>
        </div>
      )}

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">1. O que você está usando</p>
        <LookInputSection
          outfit={outfit}
          onOutfitChange={onOutfitChange}
          sneakers={sneakers}
          context={context}
          weatherBias={weatherBias}
          personalBias={bias}
          vibeId={vibeId}
          history={history}
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">2. Contexto do dia</p>
        <div className="space-y-3">
          <WeatherOccasionPanel weather={weather} onFetchWeather={onFetchWeather} context={context} onContextChange={onContextChange} />
          <VibePicker vibeId={vibeId} onChange={onVibeChange} />
          <PerfumeRecommendation weatherBias={weatherBias} context={context} ownedPerfumes={perfumes} history={history} />
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">{lockedResult ? '3. Seu MOODE' : '3. Relógios que combinam'}</p>
        {!hasSelection ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-text-muted">
            Escolha a cor de pelo menos uma peça pra ver quais relógios combinam.
          </div>
        ) : topResults.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-text-muted">
            Nenhum match forte com esse look. Tenta um mostrador neutro (preto, branco ou prata) — combina com qualquer combinação.
          </div>
        ) : (
          <MatchResults
            results={topResults}
            context={context}
            weatherBias={weatherBias}
            onSelectWatch={onSelectWatch}
            favorites={favorites}
            onToggleFavorite={onToggleFavorite}
            onLogFeedback={onLogFeedback}
            sneakers={sneakers}
            perfumes={perfumes}
            accessories={accessories}
            outfit={outfit}
            vibeId={vibeId}
            history={history}
          />
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">4. Sua escolha real</p>
        <ChoiceFeedback watches={watches} results={results} topResults={topResults} context={context} onLogChoice={onLogChoice} />
      </div>
    </div>
  )
}
