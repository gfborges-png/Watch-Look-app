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

// Campos "current" do provedor — trocar de provedor (ex: outro serviço
// sem chave) significa só reescrever fetchWeather pra devolver esse
// mesmo formato {tempC, description, bias, feelsLikeC, humidity,
// precipitationMm}; nada fora deste arquivo sabe que existe Open-Meteo.
const CURRENT_FIELDS = 'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code'

export async function fetchWeather({ lat, lon }) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=${CURRENT_FIELDS}&timezone=auto`
  let res
  try {
    res = await fetch(url)
  } catch {
    throw new Error('Não deu pra conectar no serviço de clima — checa sua internet.')
  }
  if (!res.ok) throw new Error(`Falha ao buscar o clima (servidor respondeu ${res.status}).`)
  const data = await res.json()
  const current = data.current ?? {}
  const tempC = Math.round(current.temperature_2m)
  const description = WEATHER_DESCRIPTIONS[current.weather_code] ?? 'tempo variável'
  const bias = tempC >= 27 ? 'quente' : tempC <= 16 ? 'frio' : 'ameno'
  const feelsLikeC = typeof current.apparent_temperature === 'number' ? Math.round(current.apparent_temperature) : null
  const humidity = typeof current.relative_humidity_2m === 'number' ? Math.round(current.relative_humidity_2m) : null
  const precipitationMm = typeof current.precipitation === 'number' ? current.precipitation : null
  return { tempC, description, bias, feelsLikeC, humidity, precipitationMm }
}

// Linha de resumo pra exibir — só entra o que realmente ajuda: sensação
// térmica só quando difere de verdade da temperatura (senão é ruído
// repetindo o mesmo número), umidade quando o provedor manda, chuva só
// quando está chovendo agora (não "0mm", que não diz nada útil).
export function weatherSummaryParts(weather) {
  const parts = [`${weather.tempC}°C`, weather.description]
  if (weather.feelsLikeC != null && Math.abs(weather.feelsLikeC - weather.tempC) >= 2) {
    parts.push(`sensação de ${weather.feelsLikeC}°C`)
  }
  if (weather.humidity != null) parts.push(`${weather.humidity}% umidade`)
  if (weather.precipitationMm > 0) parts.push('chovendo agora')
  return parts
}

export async function getWeatherForCurrentLocation() {
  const location = await getLocation()
  return fetchWeather(location)
}
