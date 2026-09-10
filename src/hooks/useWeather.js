import { useState } from 'react'
import { getWeatherForCurrentLocation } from '../lib/weather.js'

export function useWeather() {
  const [weather, setWeather] = useState({ status: 'idle' })

  const fetchWeather = async () => {
    setWeather({ status: 'loading' })
    try {
      const result = await getWeatherForCurrentLocation()
      setWeather({ status: 'ready', ...result })
    } catch (err) {
      setWeather({ status: 'error', error: err.message })
    }
  }

  return { weather, fetchWeather }
}
