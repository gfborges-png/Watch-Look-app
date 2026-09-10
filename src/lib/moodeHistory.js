// "Meus Moodes" — o histórico de "vou usar" (storage.getHistory, uma
// entrada por relógio/dia) enriquecido com o feedback gravado no mesmo
// momento (TodayScreen grava os dois juntos ao apertar "Vou usar": ver
// App.jsx/TodayScreen.handleUseLook) pra recuperar a ocasião e o score
// daquele dia. Sem feedback correspondente (ex: histórico de um backup
// antigo, ou marcado direto pela Coleção sem passar pela Home), a
// entrada aparece só com relógio + data — nunca inventa ocasião/score.
export function buildMoodeHistory(history, feedback, collection) {
  return history
    .map((h) => {
      const watch = collection.find((w) => w.id === h.watchId) ?? null
      const match = feedback.find((f) => f.watchId === h.watchId && f.rating === 'love' && f.date?.slice(0, 10) === h.date)
      return {
        date: h.date,
        watch,
        context: match?.context ?? null,
        score: match?.match ?? null,
      }
    })
    .filter((entry) => entry.watch !== null)
}
