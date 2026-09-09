import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchWeather, weatherSummaryParts } from './weather.js'

function mockFetchOnce(response) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: response.ok ?? true,
    status: response.status ?? 200,
    json: async () => response.body,
  })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('fetchWeather', () => {
  it('extrai temperatura, descrição e viés, além de sensação térmica/umidade/chuva quando disponíveis', async () => {
    mockFetchOnce({
      body: { current: { temperature_2m: 28.4, apparent_temperature: 31.2, relative_humidity_2m: 62, precipitation: 0, weather_code: 1 } },
    })
    const result = await fetchWeather({ lat: -23.5, lon: -46.6 })
    expect(result).toEqual({ tempC: 28, description: 'poucas nuvens', bias: 'quente', feelsLikeC: 31, humidity: 62, precipitationMm: 0 })
  })

  it('classifica o viés por faixa de temperatura (quente/frio/ameno)', async () => {
    mockFetchOnce({ body: { current: { temperature_2m: 10, weather_code: 0 } } })
    expect((await fetchWeather({ lat: 0, lon: 0 })).bias).toBe('frio')

    mockFetchOnce({ body: { current: { temperature_2m: 20, weather_code: 0 } } })
    expect((await fetchWeather({ lat: 0, lon: 0 })).bias).toBe('ameno')
  })

  it('sem campos de enriquecimento no retorno do provedor, não quebra — só ficam null', async () => {
    mockFetchOnce({ body: { current: { temperature_2m: 22, weather_code: 3 } } })
    const result = await fetchWeather({ lat: 0, lon: 0 })
    expect(result.feelsLikeC).toBeNull()
    expect(result.humidity).toBeNull()
    expect(result.precipitationMm).toBeNull()
  })

  it('código de tempo desconhecido cai num rótulo genérico em vez de undefined', async () => {
    mockFetchOnce({ body: { current: { temperature_2m: 22, weather_code: 9999 } } })
    expect((await fetchWeather({ lat: 0, lon: 0 })).description).toBe('tempo variável')
  })

  it('resposta HTTP não-ok vira erro com mensagem humana, incluindo o status', async () => {
    mockFetchOnce({ ok: false, status: 503, body: {} })
    await expect(fetchWeather({ lat: 0, lon: 0 })).rejects.toThrow('503')
  })

  it('falha de rede vira mensagem humana (não o erro técnico do fetch)', async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(fetchWeather({ lat: 0, lon: 0 })).rejects.toThrow('internet')
  })
})

describe('weatherSummaryParts', () => {
  it('sensação térmica só aparece quando difere de verdade da temperatura', () => {
    expect(weatherSummaryParts({ tempC: 22, description: 'céu limpo', feelsLikeC: 23 })).toEqual(['22°C', 'céu limpo'])
    expect(weatherSummaryParts({ tempC: 22, description: 'céu limpo', feelsLikeC: 25 })).toContain('sensação de 25°C')
  })

  it('umidade aparece quando o provedor manda o dado', () => {
    expect(weatherSummaryParts({ tempC: 22, description: 'céu limpo', humidity: 70 })).toContain('70% umidade')
    expect(weatherSummaryParts({ tempC: 22, description: 'céu limpo', humidity: null }).some((p) => p.includes('umidade'))).toBe(false)
  })

  it('chuva só aparece quando está chovendo de verdade (não em 0mm)', () => {
    expect(weatherSummaryParts({ tempC: 22, description: 'chuva', precipitationMm: 1.5 })).toContain('chovendo agora')
    expect(weatherSummaryParts({ tempC: 22, description: 'céu limpo', precipitationMm: 0 })).not.toContain('chovendo agora')
  })
})
