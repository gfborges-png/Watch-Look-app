import { useState } from 'react'
import {
  getHistory,
  logWornToday,
  getChoices,
  logChoice,
  getFeedback,
  logFeedback,
  getFavoriteLooks,
  toggleFavoriteLook,
} from '../lib/storage.js'

// Tudo que alimenta o aprendizado: uso registrado, escolhas manuais,
// feedback pós-sugestão e os Moodes favoritados (conjunto do dia, não
// item isolado — ver storage.toggleFavoriteLook).
export function useRecommendationHistory() {
  const [history, setHistory] = useState(() => getHistory())
  const [choices, setChoices] = useState(() => getChoices())
  const [feedback, setFeedback] = useState(() => getFeedback())
  const [favoriteLooks, setFavoriteLooks] = useState(() => getFavoriteLooks())

  const refresh = () => {
    setHistory(getHistory())
    setChoices(getChoices())
    setFeedback(getFeedback())
    setFavoriteLooks(getFavoriteLooks())
  }

  return {
    history,
    choices,
    feedback,
    favoriteLooks,
    logWornToday: (id, extra) => setHistory(logWornToday(id, extra)),
    logChoice: (entry) => setChoices(logChoice(entry)),
    logFeedback: (entry) => setFeedback(logFeedback(entry)),
    toggleFavoriteLook: (entry) => setFavoriteLooks(toggleFavoriteLook(entry)),
    refresh,
  }
}
