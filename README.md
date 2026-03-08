# 🕌 Madeen - Application Islamique

<div align="center">
  <img src="./assets/images/logo Madeen.png" alt="Madeen Logo" width="120"/>
  
  **Application mobile pour accompagner votre pratique spirituelle quotidienne**
  
  [![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/MalickMohamedBeka/Madeen)
  [![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
  [![React Native](https://img.shields.io/badge/React%20Native-0.76-61DAFB.svg)](https://reactnative.dev/)
  [![Expo](https://img.shields.io/badge/Expo-52-000020.svg)](https://expo.dev/)
</div>

---

## 📱 Fonctionnalités

### 🏠 Accueil
- **Heures de prière** précises basées sur votre localisation
- **Calendrier Hijri** avec date grégorienne
- **Tracker solaire** animé en temps réel
- **Verset du jour** inspirant
- **Météo** locale
- **Statistiques** de progression

### ✅ Habitudes Quotidiennes
- Suivi des 5 prières obligatoires
- Habitudes personnalisables
- Série de jours consécutifs (streak)
- Réinitialisation automatique à minuit
- Progression visuelle

### 🕌 Adoration
- **Dhikr** : 40 invocations avec compteurs
- **Duas** : 54 invocations authentiques
- **Versets** : 60 versets du Coran
- **📖 Lecteur de Coran** : 114 sourates complètes avec traduction française
- **Coran** : Suivi de lecture (604 pages)
- **Qibla** : Boussole précise vers la Kaaba

### 📊 Plus
- Statistiques détaillées
- Biographies des Prophètes
- Compagnons du Prophète ﷺ
- Paramètres personnalisables

---

## 🚀 Installation

### Prérequis
- Node.js 18+
- npm ou yarn
- Expo CLI
- Android Studio (pour Android) ou Xcode (pour iOS)

### Installation des dépendances
```bash
npm install
```

### Lancement en développement
```bash
# Avec Expo Go
npx expo start

# Sur Android
npx expo start --android

# Sur iOS
npx expo start --ios
```

---

## 📦 Build Production

### Configuration EAS
```bash
# Installer EAS CLI
npm install -g eas-cli

# Login
eas login

# Configurer le projet
eas build:configure
```

### Build APK (Android)
```bash
# Preview (APK pour test)
eas build -p android --profile preview

# Production (AAB pour Play Store)
eas build -p android --profile production
```

### Build iOS
```bash
eas build -p ios --profile production
```

---

## 🏗️ Architecture

### Structure du Projet
```
Madeen/
├── app/                    # Routes (Expo Router)
│   ├── (tabs)/            # Navigation par onglets
│   │   ├── home/          # Écran d'accueil
│   │   ├── habits/        # Habitudes
│   │   ├── worship/       # Adoration
│   │   └── more/          # Plus
│   └── _layout.tsx        # Layout racine
├── components/            # Composants réutilisables
├── constants/             # Constantes (couleurs, etc.)
├── hooks/                 # Hooks personnalisés
├── mocks/                 # Données pré-chargées
├── providers/             # Context providers
├── types/                 # Types TypeScript
└── utils/                 # Fonctions utilitaires
```

### Technologies
- **React Native** - Framework mobile
- **Expo** - Toolchain et SDK
- **TypeScript** - Typage statique
- **Expo Router** - Navigation
- **React Query** - Gestion d'état serveur
- **AsyncStorage** - Stockage local
- **Expo Location** - Géolocalisation

---

## 🔐 Sécurité & Confidentialité

### Données Locales
- ✅ Toutes les données stockées localement
- ✅ Aucune synchronisation cloud
- ✅ Aucun tracking utilisateur
- ✅ Aucune collecte de données personnelles

### Permissions
- **Localisation** (optionnelle) : Pour les heures de prière et la Qibla
- **Vibration** : Pour le feedback haptique

### APIs Externes
- **Aladhan API** : Heures de prière (HTTPS)
- **Open-Meteo** : Météo (HTTPS)

---

## 📖 Documentation

- [Architecture](./ARCHITECTURE.md) - Architecture technique détaillée
- [Fonctionnalités](./FEATURES.md) - Liste complète des fonctionnalités
- [Audit Sécurité](./AUDIT_SECURITE_PERFORMANCE.md) - Audit de sécurité et performance
- [Changelog](./CHANGELOG.md) - Historique des versions
- [Guide de démarrage](./QUICK_START.md) - Guide rapide

---

## 🤝 Contribution

Les contributions sont les bienvenues! Pour contribuer:

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 📝 License

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 👨‍💻 Auteur

**Malick Mohamed Beka**
- GitHub: [@MalickMohamedBeka](https://github.com/MalickMohamedBeka)

---

## 🙏 Remerciements

- Communauté Expo et React Native
- API Aladhan pour les heures de prière
- Tous les contributeurs et testeurs

---

## 📞 Support

Pour toute question ou problème:
- Ouvrir une [issue](https://github.com/MalickMohamedBeka/Madeen/issues)
- Contacter via GitHub

---

<div align="center">
  <p>Fait avec ❤️ pour la communauté musulmane</p>
  <p>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
</div>
