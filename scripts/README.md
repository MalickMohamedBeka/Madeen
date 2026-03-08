# Scripts Utilitaires - Madeen App

## Vue d'ensemble

Ce dossier contient des scripts utilitaires pour la maintenance et l'amélioration du code.

---

## 📜 Scripts Disponibles

### 1. remove-console-logs.js

**Description**: Remplace automatiquement tous les `console.log` par des appels au logger approprié.

**Utilisation**:

```bash
# Mode dry-run (aperçu sans modification)
node scripts/remove-console-logs.js --dry-run

# Exécution réelle (modifie les fichiers)
node scripts/remove-console-logs.js
```

**Ce que fait le script**:
- Remplace `console.log(...)` par `logger.debug(...)`
- Remplace `console.info(...)` par `logger.info(...)`
- Remplace `console.warn(...)` par `logger.warn(...)`
- Garde `console.error(...)` tel quel (erreurs critiques)
- Ajoute automatiquement l'import du logger si nécessaire

**Dossiers traités**:
- `utils/`
- `providers/`
- `services/`
- `store/`
- `hooks/`

**Fichiers exclus**:
- `logger.ts` (le logger lui-même)
- `remove-console-logs.js` (ce script)
- Tous les fichiers dans `node_modules/`

**Exemple de transformation**:

Avant:
```typescript
export function fetchData() {
  console.log('[API] Fetching data...');
  // ...
}
```

Après:
```typescript
import { logger } from '@/utils/logger';

export function fetchData() {
  logger.debug('[API] Fetching data...');
  // ...
}
```

**Statistiques affichées**:
- Nombre de fichiers traités
- Nombre de fichiers modifiés
- Nombre de remplacements par type (debug, info, warn)

**Exemple de sortie**:

```
🔍 Scanning for console.log statements...

📁 Processing utils/...
✅ Modified: utils/translation.ts
✅ Modified: utils/migration.ts
✅ Modified: utils/prayerTimes.ts

📊 Statistics:
   Files processed: 45
   Files modified: 12
   Replacements:
     - console.log → logger.debug: 87
     - console.info → logger.info: 5
     - console.warn → logger.warn: 3

✅ Done! All console.log statements have been replaced.
```

---

## 🔧 Maintenance

### Ajouter un nouveau script

1. Créer le fichier dans `scripts/`
2. Ajouter le shebang: `#!/usr/bin/env node`
3. Rendre exécutable: `chmod +x scripts/mon-script.js`
4. Documenter dans ce README

### Bonnes pratiques

- Toujours inclure un mode `--dry-run`
- Afficher des statistiques claires
- Gérer les erreurs gracieusement
- Logger les opérations importantes
- Tester sur un petit échantillon d'abord

---

## 📝 Notes

### Logger vs Console

**Pourquoi remplacer console.log?**

1. **Production**: Les logs peuvent être désactivés en production
2. **Niveaux**: Différenciation debug/info/warn/error
3. **Contexte**: Ajout automatique de timestamps et contexte
4. **Monitoring**: Intégration avec Sentry et autres outils
5. **Performance**: Logs conditionnels selon l'environnement

**Quand garder console.error?**

- Erreurs critiques qui doivent toujours être visibles
- Erreurs de démarrage de l'application
- Erreurs de configuration fatales

---

## 🚀 Prochains Scripts

### Scripts planifiés

1. **migrate-to-flashlist.js**
   - Remplace FlatList par FlashList
   - Ajoute les imports nécessaires
   - Met à jour les props

2. **analyze-bundle.js**
   - Analyse la taille du bundle
   - Identifie les dépendances lourdes
   - Suggère des optimisations

3. **check-unused-deps.js**
   - Détecte les dépendances non utilisées
   - Suggère les packages à supprimer
   - Vérifie les versions obsolètes

4. **generate-types.js**
   - Génère les types TypeScript depuis la DB
   - Synchronise les types avec le schéma
   - Valide la cohérence

---

## 📚 Ressources

### Documentation
- [Logger Utils](../utils/logger.ts)
- [Database Migrations](../utils/databaseMigrations.ts)
- [Security Audit](../docs/SECURITY_AUDIT.md)

### Guides
- [Testing Guide](../docs/TESTING_GUIDE.md)
- [Contributing](../CONTRIBUTING.md)
- [Changelog](../CHANGELOG.md)

---

**Dernière mise à jour**: 2026-03-08  
**Version**: 1.1.1
