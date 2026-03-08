# Intégration Sentry pour Monitoring API

## Vue d'ensemble

Ce guide explique comment intégrer Sentry pour le monitoring des erreurs API en production.

## Installation

### 1. Installer Sentry
```bash
npm install @sentry/react-native
npx @sentry/wizard -i reactNative
```

### 2. Configuration Initiale

Le wizard créera automatiquement la configuration. Vérifiez `app/_layout.tsx`:

```typescript
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  environment: __DEV__ ? 'development' : 'production',
  tracesSampleRate: 1.0,
  enableAutoSessionTracking: true,
  sessionTrackingIntervalMillis: 30000,
});
```

## Intégration avec API Monitoring

### 1. Modifier `utils/apiMonitoring.ts`

```typescript
import * as Sentry from '@sentry/react-native';

// Dans la méthode logError()
async logError(endpoint: string, error: Error, statusCode?: number, retryCount: number = 0): Promise<void> {
  const errorEntry: APIError = {
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    endpoint,
    error: error.message,
    statusCode,
    timestamp: Date.now(),
    retryCount,
  };

  this.errorLog.push(errorEntry);
  await this.saveErrorLog();

  // Envoyer à Sentry en production
  if (__DEV__ === false) {
    Sentry.captureException(error, {
      tags: {
        endpoint,
        statusCode: statusCode?.toString(),
        api_error: 'true',
      },
      extra: {
        retryCount,
        timestamp: errorEntry.timestamp,
      },
      level: statusCode && statusCode >= 500 ? 'error' : 'warning',
    });
  }

  console.error(`[API Monitoring] Error logged:`, errorEntry);
}
```

### 2. Ajouter des Breadcrumbs

```typescript
// Dans trackRequest()
async trackRequest(
  endpoint: string,
  success: boolean,
  responseTime: number,
  error?: Error,
  statusCode?: number
): Promise<void> {
  // ... code existant ...

  // Ajouter breadcrumb Sentry
  if (__DEV__ === false) {
    Sentry.addBreadcrumb({
      category: 'api',
      message: `${endpoint}: ${success ? 'SUCCESS' : 'FAILED'}`,
      level: success ? 'info' : 'error',
      data: {
        endpoint,
        responseTime,
        statusCode,
      },
    });
  }
}
```

### 3. Tracker les Quotas

```typescript
// Dans trackQuota()
async trackQuota(service: string): Promise<boolean> {
  // ... code existant ...

  if (remaining <= 0) {
    console.warn(`[API Monitoring] ${service} quota exceeded!`);
    
    // Alerte Sentry
    if (__DEV__ === false) {
      Sentry.captureMessage(`API Quota Exceeded: ${service}`, {
        level: 'warning',
        tags: { service, quota_exceeded: 'true' },
        extra: { used: this.quotaUsage[service].count, limit },
      });
    }
    
    return false;
  }

  if (remaining <= 10) {
    console.warn(`[API Monitoring] ${service} quota low: ${remaining} remaining`);
    
    // Alerte Sentry
    if (__DEV__ === false) {
      Sentry.captureMessage(`API Quota Low: ${service}`, {
        level: 'info',
        tags: { service, quota_low: 'true' },
        extra: { remaining, limit },
      });
    }
  }

  return true;
}
```

### 4. Tracker la Santé des APIs

```typescript
// Ajouter une fonction de monitoring périodique
export function startHealthMonitoring() {
  if (__DEV__) return; // Seulement en production

  setInterval(() => {
    const health = apiMonitoring.getHealthStatus();
    
    if (health.status === 'unhealthy') {
      Sentry.captureMessage('API Health Critical', {
        level: 'error',
        tags: { health_status: 'unhealthy' },
        extra: {
          successRate: health.successRate,
          avgResponseTime: health.avgResponseTime,
          recentErrors: health.recentErrors,
        },
      });
    } else if (health.status === 'degraded') {
      Sentry.captureMessage('API Health Degraded', {
        level: 'warning',
        tags: { health_status: 'degraded' },
        extra: {
          successRate: health.successRate,
          avgResponseTime: health.avgResponseTime,
          recentErrors: health.recentErrors,
        },
      });
    }
  }, 300000); // Toutes les 5 minutes
}
```

### 5. Initialiser dans `app/_layout.tsx`

```typescript
import { startHealthMonitoring } from '@/utils/apiMonitoring';

export default function RootLayout() {
  useEffect(() => {
    // Démarrer le monitoring de santé
    startHealthMonitoring();
  }, []);

  // ... reste du code
}
```

## Configuration Avancée

### 1. Filtrer les Erreurs

```typescript
Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  beforeSend(event, hint) {
    // Ne pas envoyer les erreurs de développement
    if (__DEV__) return null;

    // Filtrer les erreurs réseau temporaires
    const error = hint.originalException;
    if (error instanceof Error) {
      if (error.message.includes('Network request failed')) {
        // Ne pas envoyer si c'est juste une perte de connexion temporaire
        return null;
      }
    }

    return event;
  },
});
```

### 2. Grouper les Erreurs par Endpoint

```typescript
Sentry.captureException(error, {
  fingerprint: ['api-error', endpoint],
  tags: { endpoint },
});
```

### 3. Ajouter le Contexte Utilisateur

```typescript
// Quand l'utilisateur se connecte
Sentry.setUser({
  id: userId,
  username: username,
});

// Ajouter des tags personnalisés
Sentry.setTag('app_version', '1.0.0');
Sentry.setTag('network_type', networkType);
```

## Alertes Sentry

### 1. Configurer les Alertes

Dans le dashboard Sentry:
1. Aller dans **Alerts** → **Create Alert**
2. Créer des alertes pour:
   - Quota API dépassé
   - Santé API dégradée
   - Taux d'erreur > 10%
   - Temps de réponse > 5s

### 2. Intégrations

Configurer les intégrations:
- **Slack**: Notifications en temps réel
- **Email**: Résumés quotidiens
- **PagerDuty**: Alertes critiques

## Dashboard Sentry

### Métriques à Surveiller

1. **Taux d'erreur par endpoint**
   - Filtrer par tag `endpoint`
   - Voir les endpoints les plus problématiques

2. **Temps de réponse**
   - Utiliser les breadcrumbs pour voir les temps de réponse
   - Identifier les APIs lentes

3. **Quotas API**
   - Filtrer par tag `quota_exceeded` ou `quota_low`
   - Anticiper les dépassements

4. **Santé globale**
   - Filtrer par tag `health_status`
   - Voir les périodes de dégradation

## Requêtes Sentry Utiles

### 1. Erreurs API par Endpoint
```
is:unresolved api_error:true
```

### 2. Quotas Dépassés
```
quota_exceeded:true
```

### 3. Santé Dégradée
```
health_status:degraded OR health_status:unhealthy
```

### 4. Erreurs Réseau
```
message:"Network" OR message:"timeout"
```

## Performance Monitoring

### 1. Activer les Transactions

```typescript
Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  tracesSampleRate: 0.2, // 20% des transactions
  enableAutoPerformanceTracking: true,
});
```

### 2. Tracker les Requêtes API

```typescript
// Dans utils/api.ts
async function fetchPrayerTimesAPI(...) {
  const transaction = Sentry.startTransaction({
    name: 'fetchPrayerTimes',
    op: 'http.client',
  });

  try {
    const span = transaction.startChild({
      op: 'http.request',
      description: 'GET /timings',
    });

    const result = await fetchWithRetry(...);
    
    span.finish();
    transaction.finish();
    
    return result;
  } catch (error) {
    transaction.setStatus('internal_error');
    transaction.finish();
    throw error;
  }
}
```

## Tests

### 1. Tester l'Intégration Sentry

```typescript
// Dans un écran de test
import * as Sentry from '@sentry/react-native';

function TestSentryScreen() {
  const testError = () => {
    try {
      throw new Error('Test Sentry Error');
    } catch (error) {
      Sentry.captureException(error);
    }
  };

  return (
    <Button title="Test Sentry" onPress={testError} />
  );
}
```

### 2. Vérifier les Breadcrumbs

```typescript
// Faire plusieurs requêtes API
await fetchPrayerTimesAPI(...);
await fetchWeatherAPI(...);

// Déclencher une erreur
throw new Error('Test with breadcrumbs');

// Dans Sentry, vous verrez l'historique des requêtes API
```

## Coûts

### Plan Gratuit
- 5,000 événements/mois
- 1 projet
- 30 jours de rétention

### Plan Developer ($26/mois)
- 50,000 événements/mois
- Projets illimités
- 90 jours de rétention

### Recommandation
- Commencer avec le plan gratuit
- Utiliser `tracesSampleRate: 0.2` pour limiter les événements
- Filtrer les erreurs non critiques avec `beforeSend`

## Checklist d'Intégration

- [ ] Installer `@sentry/react-native`
- [ ] Configurer le DSN
- [ ] Modifier `utils/apiMonitoring.ts`
- [ ] Ajouter les breadcrumbs
- [ ] Configurer les alertes
- [ ] Tester en développement
- [ ] Déployer en production
- [ ] Configurer le dashboard
- [ ] Former l'équipe

## Ressources

- [Documentation Sentry React Native](https://docs.sentry.io/platforms/react-native/)
- [Best Practices](https://docs.sentry.io/platforms/react-native/best-practices/)
- [Performance Monitoring](https://docs.sentry.io/platforms/react-native/performance/)

## Support

En cas de problème:
1. Vérifier les logs console
2. Tester avec `Sentry.captureMessage('Test')`
3. Vérifier le DSN dans la configuration
4. Consulter la documentation Sentry
