import * as Location from 'expo-location';
import { UserLocation } from '@/types';
import { getLocationCache, saveLocationCache } from '@/utils/repositories';
import { reverseGeocodeAPI } from '@/utils/api';

const LOCATION_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 heures

export class LocationService {
  private static instance: LocationService;
  private currentLocation: UserLocation | null = null;
  private lastFetchTime: number = 0;

  private constructor() {}

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  async getCurrentLocation(forceRefresh: boolean = false): Promise<UserLocation | null> {
    // Vérifier le cache si pas de refresh forcé
    if (!forceRefresh && this.currentLocation && Date.now() - this.lastFetchTime < LOCATION_CACHE_DURATION) {
      return this.currentLocation;
    }

    // Essayer de charger depuis le cache DB
    if (!forceRefresh) {
      const cached = await getLocationCache();
      if (cached) {
        this.currentLocation = cached;
        this.lastFetchTime = Date.now();
        return cached;
      }
    }

    try {
      // Demander la permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }

      // Obtenir la position
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = position.coords;

      // Validation des coordonnées
      if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
        throw new Error('Invalid coordinates');
      }

      // Géocodage inversé pour obtenir la ville
      const geocodeResult = await reverseGeocodeAPI(latitude, longitude);
      const city = geocodeResult?.city || 'Ville inconnue';

      const location: UserLocation = {
        latitude,
        longitude,
        city,
      };

      // Sauvegarder en cache
      this.currentLocation = location;
      this.lastFetchTime = Date.now();
      await saveLocationCache(location);

      return location;
    } catch (error) {
      // Fallback: Casablanca par défaut
      const fallbackLocation: UserLocation = {
        latitude: 33.5731,
        longitude: -7.5898,
        city: 'Casablanca',
      };

      this.currentLocation = fallbackLocation;
      return fallbackLocation;
    }
  }

  clearCache(): void {
    this.currentLocation = null;
    this.lastFetchTime = 0;
  }
}

export const locationService = LocationService.getInstance();
