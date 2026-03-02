# 🚀 Guide de Démarrage Rapide - Madeen App

## ✅ Statut : Phases 2, 3 et 4 Complètes !

Toutes les fonctionnalités sont implémentées et prêtes à être testées.

## 📦 Installation

Les dépendances sont déjà installées, y compris :
- ✅ expo-av (pour les sons)
- ✅ zustand (store global)
- ✅ expo-location (géolocalisation)
- ✅ expo-haptics (vibrations)
- ✅ Toutes les autres dépendances

## 🎵 Ajouter les Fichiers Audio (Optionnel)

Pour activer les sons, ajoutez ces fichiers dans `assets/sounds/` :
- `success.mp3` - Son de succès
- `error.mp3` - Son d'erreur  
- `notification.mp3` - Son de notification
- `click.mp3` - Son de clic

**Note** : L'app fonctionne sans ces fichiers, les sons seront simplement désactivés.

## 🏃 Lancer l'Application

```bash
# Démarrer le serveur de développement
npm start

# Ou directement sur iOS
npm run ios

# Ou directement sur Android
npm run android
```

## 📱 Tester les Nouvelles Fonctionnalités

### 1. Onboarding (Premier Lancement)
- Au premier lancement, un tutoriel en 5 étapes s'affiche
- Vous pouvez le passer ou le suivre
- Il ne s'affichera plus après la première fois

### 2. Direction de la Qibla
- Allez dans **Adoration** → Bouton boussole en haut à droite
- Ou naviguez vers l'onglet **Adoration** et cherchez le bouton Qibla
- **Important** : Nécessite un appareil physique avec capteurs

### 3. Statistiques
- Allez dans **Plus** → **Statistiques**
- Visualisez votre progression par semaine, mois, année
- Graphiques interactifs et métriques détaillées

### 4. Sons et Haptiques
- Les sons se jouent automatiquement (si fichiers présents)
- Les vibrations fonctionnent sur les actions
- Configurables dans les paramètres (à venir)

## 🧪 Tests Recommandés

### Sur Simulateur/Émulateur
✅ Navigation entre les écrans
✅ Onboarding au premier lancement
✅ Statistiques
✅ Ajout/modification de données
✅ Persistance des données

### Sur Appareil Physique
✅ Boussole Qibla (nécessite capteurs)
✅ Vibrations haptiques
✅ Sons (si fichiers ajoutés)
✅ Permissions de localisation

## 🎯 Fonctionnalités Clés

### Écran Accueil
- Horaires de prière
- Progression Ramadan
- Compteur de jours

### Écran Habitudes
- Suivi des habitudes quotidiennes
- Séries et statistiques
- Ajout/modification d'habitudes

### Écran Adoration
- **Dhikr** : Compteurs avec objectifs
- **Duas** : Collection de invocations
- **Versets** : Versets favoris
- **Coran** : Suivi de lecture
- **Qibla** : Direction de la Mecque (nouveau !)

### Écran Plus
- **Prophètes** : Liste des prophètes
- **Sahabas** : Compagnons et savants
- **Statistiques** : Progression détaillée (nouveau !)
- **Paramètres** : Configuration de l'app

## 🔧 Configuration

### Réinitialiser l'Onboarding
Pour revoir le tutoriel, supprimez les données de l'app ou utilisez :
```javascript
// Dans le code
await storage.remove('ONBOARDING_COMPLETED');
```

### Activer/Désactiver les Sons
Les paramètres sont sauvegardés automatiquement dans le store Zustand.

## 📊 Architecture

### Store Global (Zustand)
- Gestion centralisée de l'état
- Sauvegarde automatique dans AsyncStorage
- État pour : habitudes, versets, dhikr, duas, paramètres, statistiques

### Système de Stockage
- Wrapper typé autour d'AsyncStorage
- Opérations simples et multiples
- Gestion d'erreurs intégrée

### Hooks d'Optimisation
- `useDebounce` : Retarder les mises à jour
- `useCache` : Mise en cache avec TTL
- `useOptimizedList` : Listes performantes

## 🐛 Problèmes Connus

### React 19 + lucide-react-native
Il y a un conflit de peer dependencies. L'app fonctionne correctement avec `--legacy-peer-deps`.

### Boussole sur Simulateur
La boussole Qibla ne fonctionne pas sur simulateur/émulateur. Testez sur un appareil physique.

## 📚 Documentation Complète

Pour plus de détails, consultez :
- `INTEGRATION_COMPLETE.md` - Résumé de l'intégration
- `FEATURES.md` - Documentation des fonctionnalités
- `USAGE_EXAMPLES.md` - Exemples de code
- `IMPLEMENTATION_GUIDE.md` - Guide d'implémentation
- `MIGRATION_CHECKLIST.md` - Checklist complète

## 🎉 C'est Parti !

Votre application est prête à être testée. Lancez `npm start` et explorez toutes les nouvelles fonctionnalités !

Si vous rencontrez des problèmes, consultez la section Dépannage dans `INTEGRATION_COMPLETE.md`.

Bon développement ! 🚀
