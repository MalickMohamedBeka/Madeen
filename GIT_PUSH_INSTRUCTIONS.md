# Instructions pour Push Git

## 📋 Prérequis

1. **Installer Git** (si pas déjà fait)
   - Télécharger: https://git-scm.com/download/win
   - Installer avec les options par défaut
   - Redémarrer le terminal après installation

2. **Vérifier l'installation**
   ```bash
   git --version
   ```

---

## 🚀 Étapes pour Push

### 1. Initialiser le Repo (si pas déjà fait)

```bash
# Aller dans le dossier du projet
cd "C:\Users\MALICK MOHAMED BEKA\Desktop\Dev\Kiro\Madeen"

# Initialiser git
git init

# Ajouter le remote
git remote add origin https://github.com/MalickMohamedBeka/Madeen.git
```

### 2. Configurer Git (première fois seulement)

```bash
# Configurer votre nom
git config user.name "Malick Mohamed Beka"

# Configurer votre email
git config user.email "votre-email@example.com"
```

### 3. Vérifier l'État du Repo

```bash
# Voir les fichiers modifiés
git status

# Voir les différences
git diff
```

### 4. Récupérer les Dernières Modifications du Remote

```bash
# Récupérer les changements du remote
git fetch origin

# Fusionner avec la branche main (ou master)
git pull origin main --allow-unrelated-histories
```

**Note**: Si vous avez des conflits, résolvez-les avant de continuer.

### 5. Ajouter les Fichiers Modifiés

```bash
# Ajouter tous les fichiers
git add .

# OU ajouter des fichiers spécifiques
git add package.json
git add utils/databaseMigrations.ts
git add providers/RamadanProvider.tsx
# etc...
```

### 6. Créer un Commit

```bash
git commit -m "feat: v1.1.1 - TypeScript fixes, Quran progress reset, PDF export

- Fixed 78 TypeScript errors
- Added migration v5 to reset Quran progress to 0/604
- Added PDF export with expo-print
- Added reset button for Quran progress
- Optimized logger calls (50+ fixes)
- Cleaned up documentation files"
```

### 7. Push vers GitHub

```bash
# Push vers la branche main
git push origin main

# OU si c'est la première fois
git push -u origin main
```

---

## 🔐 Authentification GitHub

### Option 1: Personal Access Token (Recommandé)

1. Aller sur GitHub: https://github.com/settings/tokens
2. Cliquer sur "Generate new token (classic)"
3. Donner un nom: "Madeen App"
4. Cocher: `repo` (Full control of private repositories)
5. Générer le token
6. **COPIER LE TOKEN** (vous ne le verrez qu'une fois!)

Lors du push, utiliser:
- Username: `MalickMohamedBeka`
- Password: `<votre-token>`

### Option 2: SSH Key

```bash
# Générer une clé SSH
ssh-keygen -t ed25519 -C "votre-email@example.com"

# Copier la clé publique
cat ~/.ssh/id_ed25519.pub

# Ajouter la clé sur GitHub
# https://github.com/settings/keys
```

Puis changer le remote:
```bash
git remote set-url origin git@github.com:MalickMohamedBeka/Madeen.git
```

---

## 🔄 Gestion des Conflits

Si vous avez des conflits lors du pull:

```bash
# Voir les fichiers en conflit
git status

# Éditer les fichiers pour résoudre les conflits
# Chercher les marqueurs: <<<<<<<, =======, >>>>>>>

# Après résolution, ajouter les fichiers
git add <fichier-résolu>

# Continuer le merge
git merge --continue

# OU annuler le merge
git merge --abort
```

---

## 📊 Vérifications Avant Push

### 1. Type Check
```bash
npm run type-check
```
✅ Doit retourner: Exit Code 0

### 2. Tests (optionnel)
```bash
npm test
```

### 3. Build (optionnel)
```bash
npm run build
```

---

## 📝 Fichiers Modifiés dans cette Version

### Code Principal
- `utils/databaseMigrations.ts` - Migration v5
- `providers/RamadanProvider.tsx` - Reset Quran progress
- `app/(tabs)/worship/index.tsx` - Reset button
- `utils/exportPDF.ts` - PDF export with expo-print
- `mocks/quran.ts` - Default value 0

### Corrections TypeScript (24 fichiers)
- 15 fichiers utils/ - Logger fixes
- `app/(tabs)/home/index.tsx`
- `app/(tabs)/more/index.tsx`
- `app/(tabs)/more/prophets.tsx`
- `app/(tabs)/more/statistics.tsx`
- `app/(tabs)/worship/index.tsx`
- `app/+native-intent.tsx`
- `components/OnboardingTutorial.tsx`
- `components/ProgressRing.tsx`
- `hooks/useHijriDate.ts`
- `hooks/useOptimizedList.ts`

### Documentation
- `CHANGELOG.md` - Version 1.1.1
- `docs/TYPESCRIPT_FIXES.md`
- `docs/CORRECTIONS_V1.1.1.md`
- `docs/CODE_SMELLS_FIXES.md`

### Configuration
- `package.json` - expo-print added

---

## 🎯 Commandes Rapides

```bash
# Tout en une fois (après avoir résolu les conflits)
git add .
git commit -m "feat: v1.1.1 - Major fixes and improvements"
git push origin main
```

---

## 🐛 Dépannage

### Erreur: "fatal: not a git repository"
```bash
git init
git remote add origin https://github.com/MalickMohamedBeka/Madeen.git
```

### Erreur: "failed to push some refs"
```bash
git pull origin main --allow-unrelated-histories
# Résoudre les conflits
git push origin main
```

### Erreur: "Authentication failed"
- Vérifier votre token/mot de passe
- Régénérer un token si nécessaire

### Erreur: "Permission denied"
- Vérifier que vous avez les droits sur le repo
- Vérifier votre clé SSH

---

## ✅ Checklist Finale

Avant de push:

- [ ] `npm run type-check` passe (Exit Code 0)
- [ ] Tous les fichiers temporaires supprimés
- [ ] CHANGELOG.md mis à jour
- [ ] Commit message descriptif
- [ ] Pas de fichiers sensibles (.env avec vraies valeurs, etc.)
- [ ] Tests passent (si applicable)

---

**Version**: 1.1.1  
**Date**: 2026-03-08  
**Repo**: https://github.com/MalickMohamedBeka/Madeen
