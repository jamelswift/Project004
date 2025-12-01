import type { WeatherData } from "@/types"

const WEATHER_API_KEY = "97d8748855b720c2dd02ca6143d2553e"
const WEATHER_API_URL = "https://api.openweathermap.org/data/2.5"

export async function getWeatherData(city = "Bangkok"): Promise<WeatherData | null> {
  try {
    const response = await fetch(`${WEATHER_API_URL}/weather?q=${city}&appid=${WEATHER_API_KEY}&units=metric&lang=th`)

    if (!response.ok) {
      throw new Error("Failed to fetch weather data")
    }

    const data = await response.json()

    return {
      temperature: Math.round(data.main.temp),
      humidity: data.main.humidity,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      city: data.name,
    }
  } catch (error) {
    console.error("Weather API Error:", error)
    return null
  }
}

export async function getForecast(city = "Bangkok") {
  try {
    const response = await fetch(`${WEATHER_API_URL}/forecast?q=${city}&appid=${WEATHER_API_KEY}&units=metric&lang=th`)

    if (!response.ok) {
      throw new Error("Failed to fetch forecast data")
    }

    return await response.json()
  } catch (error) {
    console.error("Forecast API Error:", error)
    return null
  }
}
