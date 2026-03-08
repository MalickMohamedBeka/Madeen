import Constants from 'expo-constants';

interface EnvConfig {
  // API URLs
  aladhanApiUrl: string;
  openMeteoApiUrl: string;
  quranApiUrl: string;
  mymemoryApiUrl: string;
  nominatimApiUrl: string;
  nominatimUserAgent: string;
  
  // App Config
  appName: string;
  appVersion: string;
  nodeEnv: 'development' | 'production' | 'test';
  
  // Feature Flags
  enableDebugLogs: boolean;
  enablePerformanceMonitoring: boolean;
}

// Fonction pour récupérer les variables d'environnement
function getEnvVar(key: string, defaultValue: string): string {
  // Essayer d'abord depuis expo-constants
  const value = Constants.expoConfig?.extra?.[key];
  if (value) return value;
  
  // Sinon utiliser la valeur par défaut
  return defaultValue;
}

// Configuration centralisée
export const env: EnvConfig = {
  // API URLs
  aladhanApiUrl: getEnvVar('ALADHAN_API_URL', 'https://api.aladhan.com/v1'),
  openMeteoApiUrl: getEnvVar('OPEN_METEO_API_URL', 'https://api.open-meteo.com/v1'),
  quranApiUrl: getEnvVar('QURAN_API_URL', 'https://api.quran.com/api/v4'),
  mymemoryApiUrl: getEnvVar('MYMEMORY_API_URL', 'https://api.mymemory.translated.net'),
  nominatimApiUrl: getEnvVar('NOMINATIM_API_URL', 'https://nominatim.openstreetmap.org'),
  nominatimUserAgent: getEnvVar('NOMINATIM_USER_AGENT', 'MadeenApp/1.0.0'),
  
  // App Config
  appName: getEnvVar('APP_NAME', 'Madeen'),
  appVersion: getEnvVar('APP_VERSION', '1.0.0'),
  nodeEnv: (getEnvVar('NODE_ENV', 'development') as 'development' | 'production' | 'test'),
  
  // Feature Flags
  enableDebugLogs: getEnvVar('NODE_ENV', 'development') === 'development',
  enablePerformanceMonitoring: getEnvVar('NODE_ENV', 'development') === 'development',
};

// Validation au démarrage
export function validateEnv(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Vérifier que les URLs sont valides
  const urlFields: (keyof EnvConfig)[] = [
    'aladhanApiUrl',
    'openMeteoApiUrl',
    'quranApiUrl',
    'mymemoryApiUrl',
    'nominatimApiUrl',
  ];
  
  for (const field of urlFields) {
    const value = env[field] as string;
    try {
      new URL(value);
    } catch {
      errors.push(`Invalid URL for ${field}: ${value}`);
    }
  }
  
  // Vérifier le User-Agent
  if (!env.nominatimUserAgent || env.nominatimUserAgent.length < 5) {
    errors.push('NOMINATIM_USER_AGENT must be at least 5 characters');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// Logger conditionnel (seulement en dev)
export const logger = {
  log: (...args: any[]) => {
    if (env.enableDebugLogs) {
      console.log(...args);
    }
  },
  warn: (...args: any[]) => {
    if (env.enableDebugLogs) {
      console.warn(...args);
    }
  },
  error: (...args: any[]) => {
    // Toujours logger les erreurs
    console.error(...args);
  },
};

export default env;
