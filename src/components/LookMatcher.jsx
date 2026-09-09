import { useMemo } from 'react'
import { GARMENTS } from '../lib/matchEngine.js'
import { recommendWatchesForLook } from '../lib/recommendationEngine.js'
import LookInputSection from './look/LookInputSection.jsx'
import WeatherOccasionPanel from './look/WeatherOccasionPanel.jsx'
import PerfumeRecommendation from './look/PerfumeRecommendation.jsx'
import MatchResults from './look/MatchResults.jsx'
import ChoiceFeedback from './look/ChoiceFeedback.jsx'

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
}) {
  const weatherBias = weather.status === 'ready' ? weather.bias : null
  const results = useMemo(
    () => recommendWatchesForLook(watches, outfit, context, { weatherBias, history, personalBias: bias }),
    [watches, outfit, context, history, weatherBias, bias],
  )

  const hasSelection = GARMENTS.some((g) => {
    const piece = outfit[g.key]
    return (!g.optional || piece.enabled) && piece.colorId
  })
  const topResults = hasSelection ? results.slice(0, 5) : []

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">1. O que você está usando</p>
        <LookInputSection outfit={outfit} onOutfitChange={onOutfitChange} sneakers={sneakers} context={context} />
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">2. Contexto do dia</p>
        <div className="space-y-3">
          <WeatherOccasionPanel weather={weather} onFetchWeather={onFetchWeather} context={context} onContextChange={onContextChange} />
          <PerfumeRecommendation weatherBias={weatherBias} context={context} ownedPerfumes={perfumes} />
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">3. Relógios que combinam</p>
        {!hasSelection ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-neutral-500">
            Escolha a cor de pelo menos uma peça pra ver quais relógios combinam.
          </div>
        ) : topResults.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-neutral-500">
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
          />
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">4. Sua escolha real</p>
        <ChoiceFeedback watches={watches} results={results} topResults={topResults} context={context} onLogChoice={onLogChoice} />
      </div>
    </div>
  )
}
