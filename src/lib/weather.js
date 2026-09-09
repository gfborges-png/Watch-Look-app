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

// Mensagens específicas por código de erro do Geolocation API — "não
// funciona" sem mais detalhe não dá pra debugar; permissão negada, sem
// sinal de GPS e timeout são causas bem diferentes.
const GEO_ERROR_MESSAGES = {
  1: 'Você negou o acesso à localização. No iPhone: Ajustes > Privacidade e Segurança > Serviços de Localização > Safari (ou o app instalado) > Ao Usar o App.',
  2: 'Não consegui obter sua localização agora (sem sinal de GPS/rede). Tenta de novo em instantes.',
  3: 'Deu timeout tentando pegar sua localização. Tenta de novo.',
}

export function getLocation() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocalização não disponível neste navegador'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(new Error(GEO_ERROR_MESSAGES[err.code] ?? 'Não foi possível acessar sua localização')),
      { timeout: 15000, maximumAge: 0 },
    )
  })
}

export async function fetchWeather({ lat, lon }) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`
  let res
  try {
    res = await fetch(url)
  } catch {
    throw new Error('Não deu pra conectar no serviço de clima — checa sua internet.')
  }
  if (!res.ok) throw new Error(`Falha ao buscar o clima (servidor respondeu ${res.status}).`)
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
