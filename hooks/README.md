# Hooks Personnalisés - Madeen

Ce dossier contient les hooks React personnalisés pour optimiser les performances et simplifier la logique de l'application.

## Hooks Disponibles

### useDebounce

Retarde la mise à jour d'une valeur jusqu'à ce qu'un certain délai se soit écoulé sans changement.

**Usage :**
```typescript
import { useDebounce } from '@/hooks/useDebounce';

const [searchQuery, setSearchQuery] = useState('');
const debouncedQuery = useDebounce(searchQuery, 300);

// debouncedQuery ne change que 300ms après la dernière modification
```

**Cas d'usage :**
- Recherche en temps réel
- Filtrage de listes
- Validation de formulaires
- Appels API optimisés

### useCache

Gère la mise en cache des données avec un TTL (Time To Live) configurable.

**Usage :**
```typescript
import { useCache } from '@/hooks/useCache';

const { data, loading, error, refresh, invalidate } = useCache(
  'cache-key',
  async () => {
    return await fetchData();
  },
  { ttl: 5 * 60 * 1000, refreshOnMount: false }
);
```

**Options :**
- `ttl` : Durée de vie du cache en millisecondes (défaut : 5 minutes)
- `refreshOnMount` : Forcer le rafraîchissement au montage (défaut : false)

**Méthodes :**
- `refresh()` : Rafraîchir les données
- `invalidate()` : Invalider le cache et rafraîchir

**Cas d'usage :**
- Horaires de prière (cache 24h)
- Données utilisateur
- Contenu statique
- Réduire les appels réseau

### useOptimizedList

Optimise les performances des listes avec recherche, tri et pagination.

**Usage :**
```typescript
import { useOptimizedList } from '@/hooks/useOptimizedList';

const { data, getItemLayout, keyExtractor, totalCount } = useOptimizedList({
  data: items,
  pageSize: 20,
  searchQuery: searchText,
  searchKeys: ['title', 'description'],
  sortKey: 'createdAt',
  sortOrder: 'desc',
});
```

**Options :**
- `data` : Tableau de données à optimiser
- `pageSize` : Nombre d'éléments par page (défaut : 20)
- `searchQuery` : Texte de recherche
- `searchKeys` : Clés à rechercher dans les objets
- `sortKey` : Clé de tri
- `sortOrder` : Ordre de tri ('asc' ou 'desc')

**Retour :**
- `data` : Données filtrées et triées
- `getItemLayout` : Fonction pour FlatList (performance)
- `keyExtractor` : Fonction pour FlatList (performance)
- `totalCount` : Nombre total d'éléments

**Cas d'usage :**
- Listes d'habitudes
- Liste de versets
- Liste de dhikr
- Toute grande liste scrollable

## Bonnes Pratiques

### Performance

1. **Utilisez useDebounce pour les recherches**
   ```typescript
   const debouncedSearch = useDebounce(searchQuery, 300);
   ```

2. **Utilisez useCache pour les données coûteuses**
   ```typescript
   const { data } = useCache('key', expensiveFetch, { ttl: 3600000 });
   ```

3. **Utilisez useOptimizedList pour les grandes listes**
   ```typescript
   const { data, getItemLayout } = useOptimizedList({ data: items });
   ```

### Mémoire

- Nettoyez les timers dans useEffect
- Utilisez des dépendances appropriées
- Évitez les re-renders inutiles

### TypeScript

- Typez toujours vos hooks
- Utilisez les génériques pour la flexibilité
- Documentez les types complexes

## Exemples Complets

### Recherche Optimisée

```typescript
function SearchableList() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  
  const { data } = useOptimizedList({
    data: allItems,
    searchQuery: debouncedQuery,
    searchKeys: ['title', 'description'],
  });
  
  return (
    <>
      <TextInput value={query} onChangeText={setQuery} />
      <FlatList data={data} renderItem={renderItem} />
    </>
  );
}
```

### Cache avec Rafraîchissement

```typescript
function PrayerTimes() {
  const { data, loading, refresh } = useCache(
    'prayer-times',
    fetchPrayerTimes,
    { ttl: 24 * 60 * 60 * 1000 }
  );
  
  return (
    <View>
      {loading ? <Spinner /> : <PrayerList times={data} />}
      <Button onPress={refresh}>Actualiser</Button>
    </View>
  );
}
```

### Liste Performante

```typescript
function HabitsList() {
  const habits = useAppStore((state) => state.habits);
  
  const { data, getItemLayout, keyExtractor } = useOptimizedList({
    data: habits,
    sortKey: 'completed',
    sortOrder: 'asc',
  });
  
  return (
    <FlatList
      data={data}
      renderItem={({ item }) => <HabitCard habit={item} />}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      removeClippedSubviews
      maxToRenderPerBatch={10}
      windowSize={5}
    />
  );
}
```

## Tests

Chaque hook devrait avoir des tests unitaires :

```typescript
// hooks/__tests__/useDebounce.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
  it('should debounce value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    );
    
    expect(result.current).toBe('initial');
    
    rerender({ value: 'updated' });
    expect(result.current).toBe('initial');
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 600));
    });
    
    expect(result.current).toBe('updated');
  });
});
```

## Contribution

Pour ajouter un nouveau hook :

1. Créez le fichier dans `hooks/`
2. Ajoutez les types TypeScript
3. Documentez l'usage
4. Ajoutez des tests
5. Mettez à jour ce README

## Ressources

- [React Hooks Documentation](https://react.dev/reference/react)
- [Custom Hooks Best Practices](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [React Native Performance](https://reactnative.dev/docs/performance)
