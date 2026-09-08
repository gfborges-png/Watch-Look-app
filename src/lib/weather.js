// Clima do dia via Open-Meteo (API pública, sem chave, funciona direto do
// navegador). Usa a geolocalização do usuário pra puxar temperatura atual
// e classificar um "viés" (quente/frio/ameno) que o motor de match usa
// pra puxar levemente pra mostradores mais claros/escuros.
const WEATHER_DESCRIPTIONS = {
  0: 'céu limpo',
  1: 'poucas nuvens',
  2: 'parcialmente nublado',
  3: 'nublado',
  45: 'neblina',
  48: 'neblina',
  51: 'garoa leve',
  53: 'garoa',
  55: 'garoa forte',
  61: 'chuva leve',
  63: 'chuva',
  65: 'chuva forte',
  71: 'neve leve',
  73: 'neve',
  75: 'neve forte',
  80: 'pancadas de chuva',
  81: 'pancadas de chuva',
  82: 'pancadas fortes',
  95: 'tempestade',
  96: 'tempestade com granizo',
  99: 'tempestade forte',
}

export function getLocation() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocalização não disponível neste navegador'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => reject(new Error('Não foi possível acessar sua localização')),
      { timeout: 8000 },
    )
  })
}

export async function fetchWeather({ lat, lon }) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Falha ao buscar o clima')
  const data = await res.json()
  const tempC = Math.round(data.current.temperature_2m)
  const description = WEATHER_DESCRIPTIONS[data.current.weather_code] ?? 'tempo variável'
  const bias = tempC >= 27 ? 'quente' : tempC <= 16 ? 'frio' : 'ameno'
  return { tempC, description, bias }
}

export async function getWeatherForCurrentLocation() {
  const location = await getLocation()
  return fetchWeather(location)
}
