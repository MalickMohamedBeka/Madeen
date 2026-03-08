# Guide de Contribution - Madeen App

Merci de votre intérêt pour contribuer à Madeen! Ce document fournit les guidelines pour contribuer au projet.

## 📋 Table des Matières

- [Code de Conduite](#code-de-conduite)
- [Comment Contribuer](#comment-contribuer)
- [Standards de Code](#standards-de-code)
- [Workflow Git](#workflow-git)
- [Tests](#tests)
- [Documentation](#documentation)
- [Revue de Code](#revue-de-code)

## 🤝 Code de Conduite

### Notre Engagement

Nous nous engageons à faire de la participation à ce projet une expérience sans harcèlement pour tous, indépendamment de l'âge, de la taille corporelle, du handicap visible ou invisible, de l'ethnicité, des caractéristiques sexuelles, de l'identité et de l'expression de genre, du niveau d'expérience, de l'éducation, du statut socio-économique, de la nationalité, de l'apparence personnelle, de la race, de la religion ou de l'identité et de l'orientation sexuelles.

### Nos Standards

Exemples de comportements qui contribuent à créer un environnement positif:
- Utiliser un langage accueillant et inclusif
- Respecter les différents points de vue et expériences
- Accepter gracieusement les critiques constructives
- Se concentrer sur ce qui est le mieux pour la communauté
- Faire preuve d'empathie envers les autres membres de la communauté

## 🚀 Comment Contribuer

### Signaler des Bugs

Les bugs sont suivis via [GitHub Issues](https://github.com/MalickMohamedBeka/Madeen/issues).

**Avant de créer un bug report:**
- Vérifiez qu'il n'existe pas déjà
- Collectez les informations nécessaires

**Informations à inclure:**
- Description claire et concise du bug
- Étapes pour reproduire
- Comportement attendu vs comportement actuel
- Screenshots si applicable
- Environnement (OS, version de l'app, device)
- Logs d'erreur

**Template de Bug Report:**
```markdown
## Description
[Description claire du bug]

## Étapes pour Reproduire
1. Aller à '...'
2. Cliquer sur '...'
3. Voir l'erreur

## Comportement Attendu
[Ce qui devrait se passer]

## Comportement Actuel
[Ce qui se passe réellement]

## Screenshots
[Si applicable]

## Environnement
- OS: [e.g. iOS 17, Android 14]
- Device: [e.g. iPhone 15, Samsung S23]
- Version: [e.g. 1.0.0]

## Logs
```
[Logs d'erreur]
```
```

### Proposer des Fonctionnalités

**Avant de proposer:**
- Vérifiez qu'elle n'existe pas déjà
- Assurez-vous qu'elle correspond à la vision du projet

**Template de Feature Request:**
```markdown
## Problème à Résoudre
[Quel problème cette fonctionnalité résout-elle?]

## Solution Proposée
[Description de la solution]

## Alternatives Considérées
[Autres solutions envisagées]

## Contexte Additionnel
[Informations supplémentaires]
```

### Soumettre des Pull Requests

1. **Fork le projet**
2. **Créer une branche** depuis `develop`:
   ```bash
   git checkout -b feature/ma-fonctionnalite
   # ou
   git checkout -b fix/mon-correctif
   ```

3. **Faire vos modifications** en suivant les standards de code

4. **Écrire/Mettre à jour les tests**

5. **Commit vos changements**:
   ```bash
   git commit -m "feat: ajouter fonctionnalité X"
   ```

6. **Push vers votre fork**:
   ```bash
   git push origin feature/ma-fonctionnalite
   ```

7. **Ouvrir une Pull Request** vers `develop`

## 📝 Standards de Code

### Style de Code

Nous utilisons **Prettier** et **ESLint** pour maintenir un style de code cohérent.

**Avant de commit:**
```bash
npm run format
npm run lint:fix
```

**Configuration:**
- Prettier: `.prettierrc.json`
- ESLint: `eslint.config.js`
- TypeScript: `tsconfig.json`

### Conventions de Nommage

#### Fichiers
- Composants: `PascalCase.tsx` (ex: `HabitCard.tsx`)
- Hooks: `camelCase.ts` (ex: `useHabits.ts`)
- Utils: `camelCase.ts` (ex: `database.ts`)
- Types: `PascalCase.ts` (ex: `Habit.ts`)
- Tests: `*.test.ts` ou `*.test.tsx`

#### Code
```typescript
// Composants: PascalCase
export default function HabitCard() {}

// Fonctions: camelCase
export function calculateStreak() {}

// Constantes: UPPER_SNAKE_CASE
export const MAX_HABITS = 50;

// Types/Interfaces: PascalCase
export interface Habit {}
export type HabitStatus = 'active' | 'completed';

// Variables: camelCase
const habitCount = 10;
```

### TypeScript

**Règles strictes activées:**
- `strict`: true
- `noImplicitAny`: true
- `strictNullChecks`: true

**Bonnes pratiques:**
```typescript
// ✅ Bon
function getHabit(id: string): Habit | null {
  return habits.find(h => h.id === id) ?? null;
}

// ❌ Mauvais
function getHabit(id: any): any {
  return habits.find(h => h.id === id);
}
```

### JSDoc

**Toutes les fonctions publiques doivent être documentées:**

```typescript
/**
 * Calcule la série actuelle d'une habitude
 * 
 * @param habit - L'habitude à analyser
 * @param completions - Historique des complétions
 * @returns Le nombre de jours consécutifs
 * 
 * @example
 * ```typescript
 * const streak = calculateStreak(habit, completions);
 * console.log(`Série: ${streak} jours`);
 * ```
 */
export function calculateStreak(
  habit: Habit,
  completions: Completion[]
): number {
  // Implementation
}
```

**Template JSDoc:**
```typescript
/**
 * [Description courte]
 * 
 * [Description détaillée optionnelle]
 * 
 * @param paramName - Description du paramètre
 * @returns Description du retour
 * @throws {ErrorType} Description de l'erreur
 * 
 * @example
 * ```typescript
 * // Exemple d'utilisation
 * ```
 * 
 * @see {@link RelatedFunction} pour plus d'informations
 */
```

### Structure des Composants

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Types
interface MyComponentProps {
  title: string;
  onPress?: () => void;
}

// Composant
export default function MyComponent({ title, onPress }: MyComponentProps) {
  // Hooks
  const [state, setState] = React.useState(false);
  
  // Handlers
  const handlePress = () => {
    onPress?.();
  };
  
  // Render
  return (
    <View style={styles.container}>
      <Text>{title}</Text>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
});
```

## 🔄 Workflow Git

### Branches

- `main` - Production, toujours stable
- `develop` - Développement, intégration des features
- `feature/*` - Nouvelles fonctionnalités
- `fix/*` - Corrections de bugs
- `hotfix/*` - Corrections urgentes en production
- `release/*` - Préparation de release

### Commits

Nous suivons la convention [Conventional Commits](https://www.conventionalcommits.org/).

**Format:**
```
<type>(<scope>): <description>

[body optionnel]

[footer optionnel]
```

**Types:**
- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `docs`: Documentation
- `style`: Formatage (pas de changement de code)
- `refactor`: Refactoring
- `perf`: Amélioration de performance
- `test`: Ajout/modification de tests
- `chore`: Tâches de maintenance
- `ci`: CI/CD
- `build`: Build system

**Exemples:**
```bash
feat(habits): ajouter filtrage par catégorie
fix(prayer): corriger calcul des heures de prière
docs(readme): mettre à jour les instructions d'installation
test(database): ajouter tests pour les migrations
refactor(api): simplifier la gestion des erreurs
perf(quran): optimiser le chargement des sourates
```

**Scope (optionnel):**
- `habits`, `prayer`, `quran`, `dhikr`, `duas`
- `api`, `database`, `ui`, `navigation`
- `ios`, `android`

### Pull Requests

**Titre:**
```
feat(habits): ajouter filtrage par catégorie
```

**Description:**
```markdown
## Description
[Description des changements]

## Type de Changement
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change
- [ ] Documentation update

## Checklist
- [ ] Code suit les standards du projet
- [ ] Tests ajoutés/mis à jour
- [ ] Documentation mise à jour
- [ ] Pas de warnings de lint
- [ ] Tous les tests passent
- [ ] Testé sur iOS et Android

## Screenshots
[Si applicable]

## Issues Liées
Closes #123
```

## 🧪 Tests

### Écrire des Tests

**Tous les nouveaux code doivent avoir des tests:**

```typescript
// utils/__tests__/myUtil.test.ts
import { myFunction } from '../myUtil';

describe('myFunction', () => {
  it('should do something', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
  
  it('should handle errors', () => {
    expect(() => myFunction(null)).toThrow();
  });
});
```

### Lancer les Tests

```bash
# Tous les tests
npm test

# Mode watch
npm run test:watch

# Avec couverture
npm run test:coverage

# Un fichier spécifique
npm test -- myUtil.test.ts
```

### Couverture Minimale

- Utils critiques: 80%+
- Composants: 70%+
- Global: 60%+

## 📚 Documentation

### Code

- **JSDoc** sur toutes les fonctions publiques
- **Commentaires** pour la logique complexe
- **Types** TypeScript explicites

### Fichiers Markdown

- **README.md** - Vue d'ensemble du projet
- **CONTRIBUTING.md** - Ce fichier
- **CHANGELOG.md** - Historique des versions
- **ARCHITECTURE.md** - Architecture technique

### Mise à Jour

Lors de l'ajout de fonctionnalités:
1. Mettre à jour le README si nécessaire
2. Ajouter une entrée dans CHANGELOG.md
3. Documenter dans FEATURES.md
4. Ajouter des exemples si pertinent

## 👀 Revue de Code

### Pour les Reviewers

**Vérifier:**
- [ ] Code suit les standards
- [ ] Tests présents et passent
- [ ] Documentation à jour
- [ ] Pas de code dupliqué
- [ ] Performance acceptable
- [ ] Sécurité respectée
- [ ] Accessibilité considérée

**Feedback constructif:**
- Être respectueux et constructif
- Expliquer le "pourquoi"
- Proposer des alternatives
- Approuver rapidement si tout est bon

### Pour les Contributeurs

**Répondre aux commentaires:**
- Être ouvert aux suggestions
- Demander des clarifications si nécessaire
- Faire les modifications demandées
- Remercier les reviewers

## 🎯 Priorités de Contribution

### Haute Priorité
- Corrections de bugs critiques
- Amélioration de la couverture de tests
- Documentation manquante
- Problèmes de performance

### Moyenne Priorité
- Nouvelles fonctionnalités
- Refactoring
- Amélioration de l'UI/UX
- Optimisations

### Basse Priorité
- Nettoyage de code
- Amélioration des messages d'erreur
- Ajout de logs

## 📞 Questions?

- Ouvrir une [Discussion](https://github.com/MalickMohamedBeka/Madeen/discussions)
- Contacter via GitHub Issues
- Consulter la documentation existante

## 🙏 Remerciements

Merci de contribuer à Madeen! Chaque contribution, petite ou grande, est appréciée.

---

**Dernière mise à jour:** Mars 2026
