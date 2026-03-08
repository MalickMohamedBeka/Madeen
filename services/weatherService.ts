import { Weather } from '@/types';
import { getWeatherCache, saveWeatherCache } from '@/utils/repositories';
import { fetchWeatherAPI } from '@/utils/api';

const WEATHER_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export class WeatherService {
  private static instance: WeatherService;
  private cachedWeather: Weather | null = null;
  private lastFetchTime: number = 0;

  private constructor() {}

  static getInstance(): WeatherService {
    if (!WeatherService.instance) {
      WeatherService.instance = new WeatherService();
    }
    return WeatherService.instance;
  }

  async getWeather(
    latitude: number,
    longitude: number,
    forceRefresh: boolean = false
  ): Promise<Weather | null> {
    // Vérifier le cache mémoire
    if (!forceRefresh && this.cachedWeather && Date.now() - this.lastFetchTime < WEATHER_CACHE_DURATION) {
      return this.cachedWeather;
    }

    // Vérifier le cache DB
    if (!forceRefresh) {
      const cached = await getWeatherCache();
      if (cached) {
        const cacheAge = Date.now() - new Date(cached.lastUpdated).getTime();
        if (cacheAge < WEATHER_CACHE_DURATION) {
          this.cachedWeather = cached;
          this.lastFetchTime = Date.now();
          return cached;
        }
      }
    }

    try {
      // Appeler l'API météo
      const weatherResponse = await fetchWeatherAPI(latitude, longitude);
      
      if (weatherResponse) {
        const weather: Weather = {
          ...weatherResponse,
          lastUpdated: new Date().toISOString(),
        };
        
        this.cachedWeather = weather;
        this.lastFetchTime = Date.now();
        await saveWeatherCache(weather);
        return weather;
      }

      return null;
    } catch (error) {
      // En cas d'erreur, retourner le cache même expiré
      return this.cachedWeather || (await getWeatherCache());
    }
  }

  clearCache(): void {
    this.cachedWeather = null;
    this.lastFetchTime = 0;
  }
}

export const weatherService = WeatherService.getInstance();
