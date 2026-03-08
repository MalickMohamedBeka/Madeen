# Architecture API - Madeen App

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                         UI Layer                                 │
│  - APIStatusCard (Paramètres)                                   │
│  - Affichage métriques en temps réel                            │
│  - Bouton "Rafraîchir tout"                                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Service Layer                               │
│  - locationService                                               │
│  - prayerTimesService                                            │
│  - weatherService                                                │
│  - Gestion des caches                                            │
│  - Logique métier                                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                       API Layer                                  │
│  utils/api.ts                                                    │
│  - fetchPrayerTimesAPI                                           │
│  - fetchWeatherAPI                                               │
│  - translateToArabicAPI                                          │
│  - reverseGeocodeAPI                                             │
│  - fetchQuranAPI                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  apiRetry    │  │  apiQueue    │  │apiMonitoring │
│              │  │              │  │              │
│ - Retry 3x   │  │ - Persist    │  │ - Metrics    │
│ - Backoff    │  │ - Priority   │  │ - Errors     │
│ - Timeout    │  │ - Auto-retry │  │ - Quotas     │
│              │  │              │  │ - Health     │
└──────────────┘  └──────────────┘  └──────────────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External APIs                                 │
│  - Aladhan (Prayer Times, Hijri)                                │
│  - Open-Meteo (Weather)                                          │
│  - Quran.com (Quran)                                             │
│  - MyMemory (Translation)                                        │
│  - Nominatim (Geocoding)                                         │
└─────────────────────────────────────────────────────────────────┘
```

## Flux de Requête

### 1. Requête Réussie (Cas Normal)

```
User Action
    ↓
Service Layer (ex: prayerTimesService)
    ↓
Check Cache (mémoire + DB)
    ↓ (cache miss)
API Layer (fetchPrayerTimesAPI)
    ↓
apiRetry.fetchWithRetry()
    ↓
fetch() → Success (200 OK)
    ↓
apiMonitoring.trackRequest(success=true)
    ↓
Save to Cache
    ↓
Return to User
```

**Temps total**: ~500-2000ms (selon réseau)

### 2. Requête avec Retry (Erreur Temporaire)

```
User Action
    ↓
Service Layer
    ↓
API Layer
    ↓
apiRetry.fetchWithRetry()
    ↓
Attempt 1: fetch() → Error (Network)
    ↓
Wait 1s (backoff)
    ↓
Attempt 2: fetch() → Error (Network)
    ↓
Wait 2s (backoff)
    ↓
Attempt 3: fetch() → Success (200 OK)
    ↓
apiMonitoring.trackRequest(success=true)
    ↓
Return to User
```

**Temps total**: ~3-5s (avec retries)

### 3. Requête Échouée (Mise en Queue)

```
User Action
    ↓
Service Layer
    ↓
API Layer
    ↓
apiRetry.fetchWithRetry()
    ↓
Attempt 1: fetch() → Error (Network)
    ↓
Attempt 2: fetch() → Error (Network)
    ↓
Attempt 3: fetch() → Error (Network)
    ↓
apiMonitoring.trackRequest(success=false)
    ↓
apiQueue.enqueue() → AsyncStorage
    ↓
Return Fallback (cache expiré ou calcul local)
    ↓
[Background] Auto-retry après 1 minute
```

**Temps total**: ~10-15s (puis fallback)

### 4. Quota Dépassé

```
User Action
    ↓
Service Layer
    ↓
API Layer
    ↓
apiMonitoring.trackQuota('mymemory')
    ↓
Check: used >= limit ?
    ↓ (yes)
apiMonitoring.logError('Quota exceeded')
    ↓
Return Fallback (texte original)
    ↓
[Optional] Sentry Alert
```

**Temps total**: ~100ms (fallback immédiat)

## Composants Détaillés

### apiRetry.ts

**Responsabilités**:
- Gérer les tentatives de retry
- Implémenter le backoff exponentiel
- Gérer les timeouts
- Décider si une erreur est retriable

**Configuration**:
```typescript
{
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  timeout: 30000
}
```

**Algorithme de Backoff**:
```
Attempt 1: 0s
Attempt 2: 1s (1000ms)
Attempt 3: 2s (2000ms)
Attempt 4: 4s (4000ms)
```

### apiQueue.ts

**Responsabilités**:
- Stocker les requêtes échouées
- Gérer les priorités (high, normal, low)
- Retry automatique toutes les minutes
- Persister avec AsyncStorage

**Structure de Queue**:
```typescript
{
  id: string,
  url: string,
  options: RequestInit,
  timestamp: number,
  retryCount: number,
  maxRetries: number,
  priority: 'high' | 'normal' | 'low'
}
```

**Tri**:
1. Par priorité (high > normal > low)
2. Par timestamp (plus ancien en premier)

### apiMonitoring.ts

**Responsabilités**:
- Tracker toutes les requêtes
- Calculer les métriques
- Logger les erreurs
- Gérer les quotas
- Calculer le statut de santé

**Métriques Trackées**:
```typescript
{
  totalRequests: number,
  successfulRequests: number,
  failedRequests: number,
  averageResponseTime: number,
  byEndpoint: {
    [endpoint]: {
      requests: number,
      failures: number,
      avgResponseTime: number
    }
  }
}
```

**Statut de Santé**:
```typescript
healthy:   successRate > 80% && recentErrors < 10
degraded:  successRate 50-80% || recentErrors 10-20
unhealthy: successRate < 50% || recentErrors > 20
```

## Intégration avec Services

### locationService

```typescript
async getCurrentLocation(forceRefresh = false) {
  // 1. Check cache
  if (!forceRefresh && this.currentLocation) {
    return this.currentLocation;
  }

  // 2. Get GPS position
  const position = await Location.getCurrentPositionAsync();

  // 3. Reverse geocode (avec retry)
  const geocodeResult = await reverseGeocodeAPI(lat, lng);

  // 4. Save to cache
  await saveLocationCache(location);

  return location;
}
```

### prayerTimesService

```typescript
async getPrayerTimes(lat, lng, forceRefresh = false) {
  // 1. Check cache
  if (!forceRefresh && this.cachedTimes) {
    return this.cachedTimes;
  }

  // 2. Try API (avec retry)
  const apiResult = await fetchPrayerTimesAPI(lat, lng);

  if (apiResult) {
    // 3. Save to cache
    await savePrayerTimesCache(apiResult);
    return apiResult;
  }

  // 4. Fallback: calcul local
  return calculatePrayerTimes(date, lat, lng);
}
```

### weatherService

```typescript
async getWeather(lat, lng, forceRefresh = false) {
  // 1. Check cache
  if (!forceRefresh && this.cachedWeather) {
    return this.cachedWeather;
  }

  // 2. Try API (avec retry)
  const weatherResponse = await fetchWeatherAPI(lat, lng);

  if (weatherResponse) {
    // 3. Save to cache
    await saveWeatherCache(weatherResponse);
    return weatherResponse;
  }

  // 4. Fallback: cache expiré
  return this.cachedWeather || await getWeatherCache();
}
```

## Gestion des Erreurs

### Types d'Erreurs

1. **Network Errors** (retriable)
   - `Network request failed`
   - `AbortError` (timeout)
   - Connection lost

2. **Server Errors** (retriable)
   - 500 Internal Server Error
   - 502 Bad Gateway
   - 503 Service Unavailable

3. **Client Errors** (non-retriable)
   - 400 Bad Request
   - 401 Unauthorized
   - 404 Not Found

4. **Quota Errors** (non-retriable)
   - 429 Too Many Requests
   - Quota exceeded

### Stratégies de Fallback

| API | Fallback |
|-----|----------|
| Prayer Times | Calcul local (algorithme astronomique) |
| Weather | Cache expiré |
| Geocoding | Coordonnées brutes |
| Translation | Texte original |
| Quran | Cache local (si disponible) |

## Performance

### Optimisations

1. **Cache Multi-Niveaux**
   ```
   Mémoire (instant) → SQLite (rapide) → API (lent)
   ```

2. **Timeouts Adaptés**
   ```
   Standard: 30s
   Quran (lourd): 45s
   ```

3. **Retry Intelligent**
   ```
   Seulement sur erreurs retriables
   Backoff exponentiel pour éviter la surcharge
   ```

4. **Queue Prioritaire**
   ```
   High: Prayer Times (critique)
   Normal: Weather, Geocoding
   Low: Translation, Analytics
   ```

### Métriques de Performance

| Métrique | Avant | Après | Amélioration |
|----------|-------|-------|--------------|
| Taux d'échec | 30-40% | 10-15% | -60-70% |
| Timeout | 10s | 30s | +200% |
| Retries | 0 | 3 | +∞ |
| Temps moyen | 1-2s | 1-3s | Stable |

## Sécurité

### Mesures Implémentées

1. **User-Agent Unique**
   ```
   MadeenApp/1.0.0 (contact@madeen.app)
   ```

2. **Validation des Entrées**
   ```typescript
   if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
     throw new Error('Invalid coordinates');
   }
   ```

3. **Gestion des Quotas**
   ```typescript
   if (used >= limit) {
     return fallback();
   }
   ```

4. **Pas de Données Sensibles**
   - Pas de tokens dans les logs
   - Pas de données utilisateur dans Sentry

## Monitoring Production

### Métriques à Surveiller

1. **Taux de succès global**
   - Objectif: > 90%
   - Alerte si < 80%

2. **Temps de réponse moyen**
   - Objectif: < 2s
   - Alerte si > 5s

3. **Erreurs récentes**
   - Objectif: < 10/heure
   - Alerte si > 20/heure

4. **Quotas API**
   - Alerte si < 10% restant
   - Alerte critique si dépassé

### Dashboard Recommandé

```
┌─────────────────────────────────────────┐
│ API Health: ● Healthy                   │
├─────────────────────────────────────────┤
│ Success Rate: 95.2%                     │
│ Avg Response: 1.8s                      │
│ Recent Errors: 3                        │
├─────────────────────────────────────────┤
│ Queue: 2 requests                       │
│ Priority: 1 high, 1 normal              │
├─────────────────────────────────────────┤
│ Quotas:                                 │
│ MyMemory: 234/1000 (77% remaining)     │
│ Nominatim: 12/100 (88% remaining)      │
└─────────────────────────────────────────┘
```

## Évolutions Futures

### Court Terme
1. Intégration Sentry
2. Tests unitaires complets
3. Alertes automatiques

### Moyen Terme
1. Cache intelligent avec prédiction
2. Compression des requêtes
3. Batch requests

### Long Terme
1. Service Worker pour offline
2. GraphQL pour optimiser les requêtes
3. CDN pour les assets statiques
