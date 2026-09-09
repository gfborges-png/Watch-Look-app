import { useState } from 'react'
import { getHistory, logWornToday, getChoices, logChoice, getFeedback, logFeedback } from '../lib/storage.js'

// Tudo que alimenta o aprendizado: uso registrado, escolhas manuais e
// feedback pós-sugestão.
export function useRecommendationHistory() {
  const [history, setHistory] = useState(() => getHistory())
  const [choices, setChoices] = useState(() => getChoices())
  const [feedback, setFeedback] = useState(() => getFeedback())

  const refresh = () => {
    setHistory(getHistory())
    setChoices(getChoices())
    setFeedback(getFeedback())
  }

  return {
    history,
    choices,
    feedback,
    logWornToday: (id) => setHistory(logWornToday(id)),
    logChoice: (entry) => setChoices(logChoice(entry)),
    logFeedback: (entry) => setFeedback(logFeedback(entry)),
    refresh,
  }
}
