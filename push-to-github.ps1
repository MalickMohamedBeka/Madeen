# Script PowerShell pour Push vers GitHub
# Usage: .\push-to-github.ps1

Write-Host "🚀 Madeen App - Push vers GitHub" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier si Git est installé
try {
    $gitVersion = git --version
    Write-Host "✅ Git installé: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git n'est pas installé!" -ForegroundColor Red
    Write-Host "Téléchargez Git depuis: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

# Vérifier si c'est un repo Git
if (-not (Test-Path .git)) {
    Write-Host "⚠️  Pas de repo Git détecté. Initialisation..." -ForegroundColor Yellow
    git init
    git remote add origin https://github.com/MalickMohamedBeka/Madeen.git
    Write-Host "✅ Repo Git initialisé" -ForegroundColor Green
}

# Vérifier le type-check
Write-Host ""
Write-Host "🔍 Vérification TypeScript..." -ForegroundColor Cyan
npm run type-check
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Type-check échoué! Corrigez les erreurs avant de continuer." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Type-check réussi" -ForegroundColor Green

# Afficher le statut
Write-Host ""
Write-Host "📊 Statut du repo:" -ForegroundColor Cyan
git status --short

# Demander confirmation
Write-Host ""
$confirm = Read-Host "Voulez-vous continuer avec le push? (o/n)"
if ($confirm -ne "o" -and $confirm -ne "O") {
    Write-Host "❌ Push annulé" -ForegroundColor Yellow
    exit 0
}

# Récupérer les changements du remote
Write-Host ""
Write-Host "📥 Récupération des changements du remote..." -ForegroundColor Cyan
git fetch origin

# Vérifier s'il y a des changements à pull
$behind = git rev-list HEAD..origin/main --count 2>$null
if ($behind -gt 0) {
    Write-Host "⚠️  Le remote a $behind commit(s) en avance" -ForegroundColor Yellow
    Write-Host "📥 Pull des changements..." -ForegroundColor Cyan
    git pull origin main --allow-unrelated-histories
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Conflits détectés! Résolvez-les manuellement." -ForegroundColor Red
        Write-Host "Après résolution:" -ForegroundColor Yellow
        Write-Host "  1. git add <fichiers-résolus>" -ForegroundColor Yellow
        Write-Host "  2. git commit -m 'Merge conflicts resolved'" -ForegroundColor Yellow
        Write-Host "  3. Relancez ce script" -ForegroundColor Yellow
        exit 1
    }
}

# Ajouter tous les fichiers
Write-Host ""
Write-Host "📦 Ajout des fichiers..." -ForegroundColor Cyan
git add .

# Créer le commit
Write-Host ""
Write-Host "💾 Création du commit..." -ForegroundColor Cyan
$commitMessage = Get-Content COMMIT_MESSAGE.txt -Raw
git commit -m $commitMessage

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Aucun changement à commiter ou erreur" -ForegroundColor Yellow
}

# Push vers GitHub
Write-Host ""
Write-Host "🚀 Push vers GitHub..." -ForegroundColor Cyan
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Push réussi!" -ForegroundColor Green
    Write-Host "🎉 Votre code est maintenant sur GitHub!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔗 Repo: https://github.com/MalickMohamedBeka/Madeen" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Push échoué!" -ForegroundColor Red
    Write-Host "Vérifiez:" -ForegroundColor Yellow
    Write-Host "  1. Vos identifiants GitHub" -ForegroundColor Yellow
    Write-Host "  2. Votre connexion internet" -ForegroundColor Yellow
    Write-Host "  3. Les permissions sur le repo" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Pour l'authentification, utilisez:" -ForegroundColor Yellow
    Write-Host "  Username: MalickMohamedBeka" -ForegroundColor Yellow
    Write-Host "  Password: <votre-personal-access-token>" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Créez un token sur: https://github.com/settings/tokens" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Appuyez sur une touche pour continuer..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
