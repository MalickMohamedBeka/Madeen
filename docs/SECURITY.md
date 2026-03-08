# Guide de Sécurité - Madeen App

## Vue d'ensemble

Ce document décrit les mesures de sécurité implémentées dans l'application Madeen pour protéger les données utilisateur et prévenir les vulnérabilités courantes.

## 1. Validation des Entrées Utilisateur

### Implémentation
Toutes les entrées utilisateur sont validées avec **Zod** avant traitement ou stockage.

**Fichier:** `utils/inputValidation.ts`

### Schémas de Validation

#### Profil Utilisateur
```typescript
UserProfileSchema = z.object({
  name: z.string().min(1).max(100).trim().regex(/^[\p{L}\p{M}\s'-]+$/u),
  nameArabic: z.string().max(100).trim().optional(),
});
```

#### Habitudes
```typescript
HabitSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200).trim(),
  icon: z.string().min(1).max(50),
  category: z.enum(['prayer', 'quran', 'dhikr', 'charity', 'knowledge', 'other']),
  completed: z.boolean(),
  isCustom: z.boolean(),
});
```

#### Versets
```typescript
VerseSchema = z.object({
  id: z.string().uuid(),
  arabic: z.string().min(1).max(5000).trim(),
  french: z.string().max(5000).trim().optional(),
  reference: z.string().min(1).max(100).trim().regex(/^[\p{L}\p{N}\s:.-]+$/u),
  // ...
});
```

### Utilisation

```typescript
import { validateHabit } from '@/utils/inputValidation';

const result = validateHabit(userInput);
if (!result.success) {
  console.error('Validation failed:', result.error);
  return;
}

// Utiliser result.data (validé et typé)
await saveHabit(result.data);
```

### Fonctions de Sanitization

```typescript
// Nettoyer les chaînes de caractères
sanitizeString(input: string): string

// Prévenir XSS
sanitizeHTML(input: string): string

// Valider UUID
sanitizeUUID(input: string): string | null

// Valider nombres
sanitizeNumber(input: unknown, min?: number, max?: number): number | null
```

## 2. Protection contre l'Injection SQL

### Requêtes Paramétrées
**TOUTES** les requêtes SQL utilisent des paramètres liés pour prévenir l'injection SQL.

**❌ MAUVAIS (vulnérable):**
```typescript
await db.execAsync(`INSERT INTO habits (title) VALUES ('${userInput}')`);
```

**✅ BON (sécurisé):**
```typescript
await db.runAsync(
  'INSERT INTO habits (id, title, icon, category) VALUES (?, ?, ?, ?)',
  [id, title, icon, category]
);
```

### Contraintes de Base de Données
Le schéma inclut des contraintes pour valider les données au niveau DB:

```sql
CREATE TABLE habits (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('prayer', 'quran', 'dhikr', 'charity', 'knowledge', 'other')),
  completed INTEGER DEFAULT 0 CHECK (completed IN (0, 1)),
  -- ...
);
```

## 3. Rate Limiting des APIs

### Implémentation
Un système de rate limiting protège contre les abus d'API et respecte les limites des services externes.

**Fichier:** `utils/rateLimiter.ts`

### Configurations

| API | Max Requêtes | Fenêtre | Intervalle Min |
|-----|--------------|---------|----------------|
| Aladhan Prayer Times | 10 | 1 heure | 1 minute |
| Aladhan Hijri Date | 20 | 1 heure | 30 secondes |
| Open-Meteo Weather | 30 | 1 heure | 30 secondes |
| Quran API Ayah | 50 | 1 heure | 10 secondes |
| Quran API Surah | 20 | 1 heure | 30 secondes |
| MyMemory Translate | 50 | 24 heures | 5 secondes |
| Nominatim Geocode | 10 | 1 heure | 1 minute |

### Utilisation

```typescript
import { rateLimitedFetch } from '@/utils/rateLimiter';

try {
  const data = await rateLimitedFetch('aladhan-prayer-times', async () => {
    return await fetchPrayerTimesAPI(lat, lng);
  });
} catch (error) {
  if (error.rateLimited) {
    console.log(`Rate limited. Retry after ${error.retryAfter}s`);
  }
}
```

### Fonctionnalités
- **Fenêtre glissante:** Limite le nombre de requêtes par période
- **Intervalle minimum:** Empêche les requêtes trop fréquentes
- **Backoff exponentiel:** Augmente le délai après dépassement de limite
- **Statut en temps réel:** Vérifier l'utilisation actuelle

```typescript
import { getAllRateLimitStatus } from '@/utils/rateLimiter';

const status = getAllRateLimitStatus();
// { 'aladhan-prayer-times': { count: 3, limit: 10, resetIn: 3420 } }
```

## 4. Validation des Réponses API

### Schémas de Validation

```typescript
// Prayer Times API
PrayerTimesAPISchema = z.object({
  data: z.object({
    timings: z.object({
      Fajr: z.string().regex(/^\d{2}:\d{2}/),
      Sunrise: z.string().regex(/^\d{2}:\d{2}/),
      // ...
    }),
  }),
});

// Weather API
WeatherAPISchema = z.object({
  current_weather: z.object({
    temperature: z.number(),
    weathercode: z.number().int().min(0).max(99),
    windspeed: z.number().optional(),
  }),
});
```

### Utilisation

```typescript
import { validatePrayerTimesAPI } from '@/utils/inputValidation';

const response = await fetch(url);
const data = await response.json();

const result = validatePrayerTimesAPI(data);
if (!result.success) {
  throw new Error('Invalid API response');
}

// Utiliser result.data (validé)
```

## 5. Gestion des Données Sensibles

### Données Stockées Localement

**Données utilisateur:**
- Nom (optionnel)
- Localisation (latitude/longitude)
- Préférences de l'application

**⚠️ Note:** Actuellement, les données sont stockées en clair dans SQLite. Pour une sécurité renforcée, considérer:

### Recommandations Futures

1. **Chiffrement des données sensibles**
   ```typescript
   import * as SecureStore from 'expo-secure-store';
   
   // Stocker
   await SecureStore.setItemAsync('user_location', JSON.stringify(location));
   
   // Récupérer
   const location = JSON.parse(await SecureStore.getItemAsync('user_location'));
   ```

2. **Anonymisation**
   - Ne stocker que les données nécessaires
   - Utiliser des identifiants anonymes
   - Permettre la suppression complète des données

3. **Permissions minimales**
   - Utiliser `ACCESS_COARSE_LOCATION` au lieu de `ACCESS_FINE_LOCATION`
   - Demander les permissions uniquement quand nécessaire
   - Expliquer clairement l'utilisation des données

## 6. Migrations de Base de Données

### Système de Migrations Versionnées
**Fichier:** `utils/databaseMigrations.ts`

### Avantages
- ✅ Pas de perte de données
- ✅ Rollback possible
- ✅ Historique des changements
- ✅ Migrations atomiques

### Structure

```typescript
const migration: Migration = {
  version: 2,
  name: 'add_unique_constraints',
  up: async (db) => {
    // Appliquer les changements
    await db.execAsync('CREATE UNIQUE INDEX ...');
  },
  down: async (db) => {
    // Annuler les changements
    await db.execAsync('DROP INDEX ...');
  },
};
```

### Utilisation

```typescript
import { runMigrations, rollbackTo } from '@/utils/databaseMigrations';

// Appliquer les migrations
await runMigrations(db);

// Rollback (si nécessaire)
await rollbackTo(db, 1);
```

## 7. Gestion des Erreurs

### Principes
1. **Ne jamais exposer les détails techniques** dans les messages d'erreur utilisateur
2. **Logger les erreurs** pour le débogage
3. **Fournir des messages clairs** à l'utilisateur

### Exemple

```typescript
try {
  await saveHabit(habit);
} catch (error) {
  // Log détaillé pour le développeur
  console.error('[Habit] Save failed:', error);
  
  // Message simple pour l'utilisateur
  Alert.alert(
    'Erreur',
    'Impossible de sauvegarder l\'habitude. Veuillez réessayer.'
  );
}
```

## 8. Timeouts et Abort Controllers

### Protection contre les Requêtes Bloquantes

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10000);

try {
  const response = await fetch(url, {
    signal: controller.signal,
    headers: { 'Accept': 'application/json' },
  });
  
  clearTimeout(timeoutId);
  return await response.json();
} catch (error) {
  if (error.name === 'AbortError') {
    console.error('Request timeout');
  }
  throw error;
}
```

## 9. Checklist de Sécurité

### Avant Chaque Release

- [ ] Toutes les entrées utilisateur sont validées avec Zod
- [ ] Toutes les requêtes SQL utilisent des paramètres liés
- [ ] Les réponses API sont validées
- [ ] Le rate limiting est actif
- [ ] Les timeouts sont configurés
- [ ] Les erreurs sont gérées proprement
- [ ] Les logs ne contiennent pas de données sensibles
- [ ] Les permissions sont minimales
- [ ] La documentation de sécurité est à jour

### Tests de Sécurité

1. **Injection SQL**
   - Tester avec des caractères spéciaux: `'; DROP TABLE habits; --`
   - Vérifier que les requêtes paramétrées fonctionnent

2. **XSS**
   - Tester avec du HTML: `<script>alert('XSS')</script>`
   - Vérifier la sanitization

3. **Rate Limiting**
   - Faire des requêtes rapides successives
   - Vérifier que le rate limiter bloque

4. **Validation**
   - Envoyer des données invalides
   - Vérifier que Zod rejette

## 10. Ressources

### Documentation
- [Zod Documentation](https://zod.dev/)
- [SQLite Security](https://www.sqlite.org/security.html)
- [OWASP Mobile Security](https://owasp.org/www-project-mobile-security/)
- [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)

### Outils
- `utils/inputValidation.ts` - Validation et sanitization
- `utils/rateLimiter.ts` - Rate limiting
- `utils/databaseMigrations.ts` - Migrations sécurisées
- `docs/database-schema.md` - Documentation du schéma

## Contact

Pour signaler une vulnérabilité de sécurité, veuillez contacter l'équipe de développement.
