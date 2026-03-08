#!/bin/bash

# Script Bash pour Push vers GitHub
# Usage: ./push-to-github.sh

echo "🚀 Madeen App - Push vers GitHub"
echo "================================="
echo ""

# Vérifier si Git est installé
if ! command -v git &> /dev/null; then
    echo "❌ Git n'est pas installé!"
    echo "Téléchargez Git depuis: https://git-scm.com/downloads"
    exit 1
fi

echo "✅ Git installé: $(git --version)"

# Vérifier si c'est un repo Git
if [ ! -d .git ]; then
    echo "⚠️  Pas de repo Git détecté. Initialisation..."
    git init
    git remote add origin https://github.com/MalickMohamedBeka/Madeen.git
    echo "✅ Repo Git initialisé"
fi

# Vérifier le type-check
echo ""
echo "🔍 Vérification TypeScript..."
npm run type-check
if [ $? -ne 0 ]; then
    echo "❌ Type-check échoué! Corrigez les erreurs avant de continuer."
    exit 1
fi
echo "✅ Type-check réussi"

# Afficher le statut
echo ""
echo "📊 Statut du repo:"
git status --short

# Demander confirmation
echo ""
read -p "Voulez-vous continuer avec le push? (o/n) " confirm
if [ "$confirm" != "o" ] && [ "$confirm" != "O" ]; then
    echo "❌ Push annulé"
    exit 0
fi

# Récupérer les changements du remote
echo ""
echo "📥 Récupération des changements du remote..."
git fetch origin

# Vérifier s'il y a des changements à pull
behind=$(git rev-list HEAD..origin/main --count 2>/dev/null)
if [ "$behind" -gt 0 ]; then
    echo "⚠️  Le remote a $behind commit(s) en avance"
    echo "📥 Pull des changements..."
    git pull origin main --allow-unrelated-histories
    
    if [ $? -ne 0 ]; then
        echo "❌ Conflits détectés! Résolvez-les manuellement."
        echo "Après résolution:"
        echo "  1. git add <fichiers-résolus>"
        echo "  2. git commit -m 'Merge conflicts resolved'"
        echo "  3. Relancez ce script"
        exit 1
    fi
fi

# Ajouter tous les fichiers
echo ""
echo "📦 Ajout des fichiers..."
git add .

# Créer le commit
echo ""
echo "💾 Création du commit..."
git commit -F COMMIT_MESSAGE.txt

if [ $? -ne 0 ]; then
    echo "⚠️  Aucun changement à commiter ou erreur"
fi

# Push vers GitHub
echo ""
echo "🚀 Push vers GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Push réussi!"
    echo "🎉 Votre code est maintenant sur GitHub!"
    echo ""
    echo "🔗 Repo: https://github.com/MalickMohamedBeka/Madeen"
else
    echo ""
    echo "❌ Push échoué!"
    echo "Vérifiez:"
    echo "  1. Vos identifiants GitHub"
    echo "  2. Votre connexion internet"
    echo "  3. Les permissions sur le repo"
    echo ""
    echo "Pour l'authentification, utilisez:"
    echo "  Username: MalickMohamedBeka"
    echo "  Password: <votre-personal-access-token>"
    echo ""
    echo "Créez un token sur: https://github.com/settings/tokens"
fi

echo ""
read -p "Appuyez sur Entrée pour continuer..."
