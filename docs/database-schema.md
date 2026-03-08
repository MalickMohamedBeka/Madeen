# Schéma de Base de Données - Madeen App

## Vue d'ensemble

L'application utilise SQLite (via expo-sqlite) pour le stockage local des données. Le schéma est géré par un système de migrations versionnées.

Version actuelle: **3**

## Tables

### 1. user_profile
Profil utilisateur (singleton - un seul enregistrement avec id=1)

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, CHECK (id = 1) | Identifiant fixe à 1 |
| name | TEXT | NOT NULL | Nom de l'utilisateur |
| name_arabic | TEXT | NULL | Nom en arabe (optionnel) |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP | Date de création |
| updated_at | TEXT | DEFAULT CURRENT_TIMESTAMP | Date de mise à jour |

### 2. habits
Habitudes religieuses de l'utilisateur

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| title | TEXT | NOT NULL | Titre de l'habitude |
| icon | TEXT | NOT NULL | Nom de l'icône |
| category | TEXT | NOT NULL, CHECK | Catégorie: prayer, quran, dhikr, charity, knowledge, other |
| completed | INTEGER | DEFAULT 0, CHECK (0,1) | Statut de complétion (booléen) |
| is_custom | INTEGER | DEFAULT 0, CHECK (0,1) | Habitude personnalisée (booléen) |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP | Date de création |
| updated_at | TEXT | DEFAULT CURRENT_TIMESTAMP | Date de mise à jour |

**Index:**
- `idx_habits_category` sur `category`
- `idx_habits_completed` sur `completed`
- `idx_habits_title_unique` UNIQUE sur `title` WHERE `is_custom = 1`

### 3. verses
Versets coraniques sauvegardés

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| text | TEXT | NOT NULL | Texte arabe du verset |
| translation | TEXT | NULL | Traduction française |
| reference | TEXT | NOT NULL | Référence (ex: Al-Baqarah 2:186) |
| is_favorite | INTEGER | DEFAULT 0, CHECK (0,1) | Favori (booléen) |
| is_read | INTEGER | DEFAULT 0, CHECK (0,1) | Lu (booléen) |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP | Date de création |

**Index:**
- `idx_verses_favorite` sur `is_favorite`
- `idx_verses_read` sur `is_read`
- `idx_verses_reference_unique` UNIQUE sur `reference`

### 4. dhikr_items
Items de dhikr avec compteur

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| arabic | TEXT | NOT NULL | Texte arabe |
| transliteration | TEXT | NULL | Translitération |
| french | TEXT | NOT NULL | Traduction française |
| target | INTEGER | NOT NULL, CHECK (> 0) | Objectif de répétitions |
| count | INTEGER | DEFAULT 0, CHECK (>= 0) | Compteur actuel |
| is_custom | INTEGER | DEFAULT 0, CHECK (0,1) | Dhikr personnalisé (booléen) |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP | Date de création |
| updated_at | TEXT | DEFAULT CURRENT_TIMESTAMP | Date de mise à jour |

### 5. duas
Invocations (duas)

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| title | TEXT | NULL | Titre de la dua |
| arabic | TEXT | NOT NULL | Texte arabe |
| transliteration | TEXT | NULL | Translitération |
| french | TEXT | NOT NULL | Traduction française |
| category | TEXT | CHECK | Catégorie: morning, evening, prayer, food, travel, general |
| is_favorite | INTEGER | DEFAULT 0, CHECK (0,1) | Favori (booléen) |
| is_custom | INTEGER | DEFAULT 0, CHECK (0,1) | Dua personnalisée (booléen) |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP | Date de création |

**Index:**
- `idx_duas_favorite` sur `is_favorite`
- `idx_duas_category` sur `category`

### 6. prophets
Prophètes de l'Islam

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| name_french | TEXT | NOT NULL | Nom en français |
| name_arabic | TEXT | NULL | Nom en arabe |
| name_translit | TEXT | NULL | Translitération |
| description | TEXT | NULL | Description/histoire |
| key_event | TEXT | NULL | Événement clé |
| quranic_mention | TEXT | NULL | Mention coranique |
| order | INTEGER | DEFAULT 0 | Ordre d'affichage |
| is_custom | INTEGER | DEFAULT 0, CHECK (0,1) | Prophète personnalisé (booléen) |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP | Date de création |
| updated_at | TEXT | DEFAULT CURRENT_TIMESTAMP | Date de mise à jour |

**Index:**
- `idx_prophets_order` sur `order`

### 7. sahabas
Compagnons du Prophète (ﷺ)

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| name_french | TEXT | NOT NULL | Nom en français |
| name_arabic | TEXT | NULL | Nom en arabe |
| name_translit | TEXT | NULL | Translitération |
| title | TEXT | NULL | Titre/surnom |
| description | TEXT | NULL | Description/biographie |
| key_contribution | TEXT | NULL | Contribution principale |
| birth_year | TEXT | NULL | Année de naissance |
| death_year | TEXT | NULL | Année de décès |
| category | TEXT | DEFAULT 'sahaba', CHECK | Catégorie: sahaba, sahabi, companion |
| is_custom | INTEGER | DEFAULT 0, CHECK (0,1) | Sahaba personnalisé (booléen) |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP | Date de création |
| updated_at | TEXT | DEFAULT CURRENT_TIMESTAMP | Date de mise à jour |

### 8. quran_progress
Progression de lecture du Coran (singleton - id=1)

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, CHECK (id = 1) | Identifiant fixe à 1 |
| current_page | INTEGER | DEFAULT 1, CHECK (1-604) | Page actuelle |
| current_juz | INTEGER | DEFAULT 1, CHECK (1-30) | Juz actuel |
| total_pages_read | INTEGER | DEFAULT 0, CHECK (>= 0) | Total de pages lues |
| pages_read_today | INTEGER | DEFAULT 0, CHECK (>= 0) | Pages lues aujourd'hui |
| daily_goal | INTEGER | DEFAULT 2, CHECK (>= 1) | Objectif quotidien |
| last_read_date | TEXT | NULL | Date de dernière lecture |
| updated_at | TEXT | DEFAULT CURRENT_TIMESTAMP | Date de mise à jour |

### 9. streak_data
Données de série (streak) (singleton - id=1)

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, CHECK (id = 1) | Identifiant fixe à 1 |
| current_streak | INTEGER | DEFAULT 0, CHECK (>= 0) | Série actuelle |
| best_streak | INTEGER | DEFAULT 0, CHECK (>= 0) | Meilleure série |
| last_streak_date | TEXT | NULL | Date de dernière série |
| updated_at | TEXT | DEFAULT CURRENT_TIMESTAMP | Date de mise à jour |

### 10. settings
Paramètres de l'application (singleton - id=1)

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, CHECK (id = 1) | Identifiant fixe à 1 |
| sound_enabled | INTEGER | DEFAULT 1, CHECK (0,1) | Sons activés (booléen) |
| haptics_enabled | INTEGER | DEFAULT 1, CHECK (0,1) | Vibrations activées (booléen) |
| notifications_enabled | INTEGER | DEFAULT 1, CHECK (0,1) | Notifications activées (booléen) |
| dark_mode | INTEGER | DEFAULT 0, CHECK (0,1) | Mode sombre (booléen) |
| updated_at | TEXT | DEFAULT CURRENT_TIMESTAMP | Date de mise à jour |

### 11. location_cache
Cache de localisation (singleton - id=1)

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, CHECK (id = 1) | Identifiant fixe à 1 |
| latitude | REAL | NOT NULL, CHECK (-90 à 90) | Latitude |
| longitude | REAL | NOT NULL, CHECK (-180 à 180) | Longitude |
| city | TEXT | NULL | Nom de la ville |
| updated_at | TEXT | DEFAULT CURRENT_TIMESTAMP | Date de mise à jour |

### 12. weather_cache
Cache météo (singleton - id=1)

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, CHECK (id = 1) | Identifiant fixe à 1 |
| temperature | INTEGER | NULL | Température en °C |
| condition | TEXT | CHECK | Condition: clear, cloudy, rainy, snowy |
| icon | TEXT | NULL | Emoji de l'icône |
| updated_at | TEXT | DEFAULT CURRENT_TIMESTAMP | Date de mise à jour |

**Durée de cache:** 30 minutes

### 13. prayer_times_cache
Cache des horaires de prière (singleton - id=1)

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, CHECK (id = 1) | Identifiant fixe à 1 |
| fajr | TEXT | NOT NULL | Heure du Fajr (HH:MM) |
| sunrise | TEXT | NOT NULL | Heure du lever du soleil (HH:MM) |
| dhuhr | TEXT | NOT NULL | Heure du Dhuhr (HH:MM) |
| asr | TEXT | NOT NULL | Heure du Asr (HH:MM) |
| maghrib | TEXT | NOT NULL | Heure du Maghrib (HH:MM) |
| isha | TEXT | NOT NULL | Heure du Isha (HH:MM) |
| date | TEXT | NOT NULL | Date (YYYY-MM-DD) |
| updated_at | TEXT | DEFAULT CURRENT_TIMESTAMP | Date de mise à jour |

**Durée de cache:** 24 heures (jusqu'à minuit)

### 14. daily_stats
Statistiques quotidiennes

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| date | TEXT | PRIMARY KEY | Date (YYYY-MM-DD) |
| habits_completed | INTEGER | DEFAULT 0, CHECK (>= 0) | Habitudes complétées |
| prayers_on_time | INTEGER | DEFAULT 0, CHECK (0-5) | Prières à l'heure |
| quran_pages | INTEGER | DEFAULT 0, CHECK (>= 0) | Pages de Coran lues |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP | Date de création |

**Index:**
- `idx_daily_stats_date` sur `date DESC`

### 15. app_state
État de l'application (singleton - id=1)

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, CHECK (id = 1) | Identifiant fixe à 1 |
| last_reset_date | TEXT | NULL | Date de dernière réinitialisation |
| updated_at | TEXT | DEFAULT CURRENT_TIMESTAMP | Date de mise à jour |

### 16. schema_migrations
Suivi des migrations (ajouté en v3)

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| version | INTEGER | PRIMARY KEY | Numéro de version |
| name | TEXT | NOT NULL | Nom de la migration |
| applied_at | TEXT | DEFAULT CURRENT_TIMESTAMP | Date d'application |

## Migrations

### Version 1: Initial Schema
- Création de toutes les tables principales
- Ajout des index de performance
- Contraintes CHECK pour l'intégrité des données

### Version 2: UNIQUE Constraints
- Ajout de contrainte UNIQUE sur `habits.title` pour les habitudes personnalisées
- Ajout de contrainte UNIQUE sur `verses.reference`

### Version 3: Migration Tracking
- Ajout de la table `schema_migrations` pour suivre l'historique des migrations

## Sécurité

### Requêtes Paramétrées
Toutes les requêtes utilisent des paramètres liés (`runAsync` avec params) pour prévenir les injections SQL.

**Exemple:**
```typescript
await db.runAsync(
  'INSERT INTO habits (id, title, icon, category) VALUES (?, ?, ?, ?)',
  [id, title, icon, category]
);
```

### Validation des Entrées
Toutes les entrées utilisateur sont validées avec Zod avant insertion en base de données.

### Contraintes de Base de Données
- CHECK constraints pour valider les valeurs (ex: booléens 0/1, plages de valeurs)
- UNIQUE constraints pour éviter les doublons
- NOT NULL pour les champs obligatoires

## Performance

### Index
Des index sont créés sur les colonnes fréquemment requêtées:
- `habits`: category, completed
- `verses`: is_favorite, is_read, reference
- `duas`: is_favorite, category
- `prophets`: order
- `daily_stats`: date (DESC)

### Cache
Les données API sont mises en cache pour réduire les appels réseau:
- Prayer times: 24h
- Weather: 30min
- Location: Permanent (jusqu'à changement)

## Maintenance

### Ajouter une Migration
1. Créer une nouvelle migration dans `utils/databaseMigrations.ts`
2. Incrémenter `CURRENT_VERSION`
3. Implémenter les fonctions `up()` et `down()`
4. Tester la migration et le rollback

### Rollback
```typescript
import { rollbackTo } from '@/utils/databaseMigrations';
await rollbackTo(db, targetVersion);
```

### Reset (Testing)
```typescript
import { resetDatabase } from '@/utils/databaseMigrations';
await resetDatabase(db);
```

## Notes

- Les booléens sont stockés comme INTEGER (0 = false, 1 = true)
- Les dates sont stockées en format ISO 8601 (TEXT)
- Les UUID sont stockés en format string
- Les tables singleton utilisent CHECK (id = 1) pour garantir un seul enregistrement
