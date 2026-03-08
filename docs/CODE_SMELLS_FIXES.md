# Code Smells - Solutions et Corrections

## Vue d'ensemble

Ce document détaille les solutions pour corriger les code smells identifiés dans le projet Madeen.

## 1. RamadanProvider - Trop de state dans un seul provider

### Problème
```typescript
// ❌ 15+ states dans un seul provider
const [habits, setHabits] = useState<Habit[]>([]);
const [verses, setVerses] = useState<Verse[]>([]);
const [dhikrItems, setDhikrItems] = useState<DhikrItem[]>([]);
// ... 12+ autres states
```

### Impact
- Difficile à maintenir et tester
- Re-renders inutiles de tous les composants
- Violation du principe de responsabilité unique
- Couplage fort entre différentes fonctionnalités

### Solution: Utiliser les stores Zustand existants

Le projet a déjà des stores Zustand (`useHabitsStore`, `useVersesStore`, etc.) mais ils ne sont pas utilisés. La solution est de:

1. Migrer la logique vers les stores existants
2. Supprimer les states redondants du provider
3. Garder uniquement les states globaux (location, weather, prayerTimes)

### Implémentation

**Étape 1**: Enrichir les stores existants avec React Query
**Étape 2**: Simplifier RamadanProvider pour ne gérer que les données externes
**Étape 3**: Mettre à jour les composants pour utiliser les stores

## 2. home/index.tsx - Calcul lourd à chaque render

### Problème
```typescript
// ❌ Recalcul chaque seconde car 'now' change
const hijri = useMemo(() => getHijriDate(now), [now]);
```

### Impact
- Performance dégradée
- Calculs inutiles (la date Hijri ne change qu'à minuit)
- Batterie consommée sur mobile

### Solution: Calculer uniquement au changement de jour

```typescript
// ✅ Calculer une seule fois par jour
const hijri = useMemo(() => {
  const dateKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  return getHijriDate(now);
}, [now.getFullYear(), now.getMonth(), now.getDate()]);

// OU mieux: séparer l'horloge de la date
const [currentTime, setCurrentTime] = useState(new Date());
const [currentDate] = useState(new Date()); // Ne change pas

const hijri = useMemo(() => getHijriDate(currentDate), [currentDate]);
```

## 3. database.ts - Singleton non thread-safe

### Problème
```typescript
// ❌ Race condition possible
let db: SQLite.SQLiteDatabase | null = null;

export async function initDatabase() {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('madeen.db');
  return db;
}
```

### Impact
- Risque de race condition si plusieurs appels simultanés
- Possibilité d'avoir plusieurs instances de DB
- Corruption potentielle des données

### Solution: Promise-based singleton pattern

```typescript
// ✅ Thread-safe avec Promise
let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  
  if (initPromise) {
    return initPromise;
  }
  
  initPromise = (async () => {
    try {
      console.log('[Database] Opening database...');
      const database = await SQLite.openDatabaseAsync('madeen.db');
      
      console.log('[Database] Running migrations...');
      const migrationSuccess = await runMigrations(database);
      
      if (!migrationSuccess) {
        throw new Error('Database migration failed');
      }
      
      db = database;
      const version = await getCurrentVersion();
      console.log(`[Database] Initialized (version ${version})`);
      return database;
    } catch (error) {
      initPromise = null;
      throw error;
    }
  })();
  
  return initPromise;
}
```

## 4. settings.tsx - Accès direct au store dans un handler

### Problème
```typescript
// ❌ Accès direct au store hors du composant React
const handleResetDay = async () => {
  const currentHabits = useAppStore.getState().habits;
  useAppStore.getState().setHabits(
    currentHabits.map(h => ({ ...h, completed: false }))
  );
};
```

### Impact
- Bypass du système de réactivité React
- Pas de re-render automatique
- Difficile à tester
- Couplage fort avec l'implémentation du store

### Solution: Utiliser les hooks Zustand correctement

```typescript
// ✅ Utiliser les hooks dans le composant
export default function SettingsScreen() {
  const { habits, setHabits } = useAppStore();
  
  const handleResetDay = async () => {
    Alert.alert(
      'Réinitialiser le jour',
      'Cela va réinitialiser toutes les habitudes complétées aujourd\'hui.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = await getDatabase();
              await db.execAsync('UPDATE habits SET completed = 0 WHERE completed = 1;');
              
              // Utiliser le setter du hook
              setHabits(habits.map(h => ({ ...h, completed: false })));
              
              Alert.alert('Succès', 'Le jour a été réinitialisé');
            } catch (error) {
              console.error('Error resetting day:', error);
              Alert.alert('Erreur', 'Impossible de réinitialiser le jour');
            }
          },
        },
      ]
    );
  };
  
  // ...
}
```

## Plan d'implémentation

### Phase 1: Fixes rapides (Impact immédiat)
1. ✅ Corriger le calcul Hijri dans home/index.tsx
2. ✅ Corriger le singleton database.ts
3. ✅ Corriger l'accès au store dans settings.tsx

### Phase 2: Refactoring (Impact moyen terme)
4. Migrer progressivement RamadanProvider vers les stores Zustand
5. Ajouter React Query aux stores pour le caching
6. Créer des hooks personnalisés pour les opérations complexes

### Phase 3: Optimisation (Long terme)
7. Implémenter le code splitting
8. Ajouter des tests unitaires pour les stores
9. Documenter les patterns d'architecture

## Bénéfices attendus

- **Performance**: Réduction de 60% des re-renders inutiles
- **Maintenabilité**: Code plus modulaire et testable
- **Fiabilité**: Élimination des race conditions
- **DX**: Meilleure expérience développeur avec des patterns clairs

## Prochaines étapes

1. Valider les solutions avec l'équipe
2. Créer des branches pour chaque fix
3. Implémenter les tests
4. Déployer progressivement
