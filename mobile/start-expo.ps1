# Script PowerShell pour lancer Expo
Write-Host "Demarrage d'Expo..."
Set-Location "d:\Theophane\Documents\Code\JuriNapse\mobile"
Write-Host "Repertoire courant: $(Get-Location)"

# Vérifier que Node et NPX fonctionnent
Write-Host "Version Node: $(node --version)"
Write-Host "Version NPX: $(npx --version)"

# Lancer Expo avec toutes les options de debug
Write-Host "Lancement d'Expo..."
npx expo start --dev-client --lan --port 19000

Read-Host "Appuyez sur Entree pour fermer"
