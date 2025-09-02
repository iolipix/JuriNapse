@echo off
echo Installation des dépendances JuriNapse Frontend...
cd /d "%~dp0frontend"
echo.
echo Répertoire actuel: %CD%
echo.
echo Installation des packages npm...
npm install
echo.
echo Installation terminée !
echo Vous pouvez maintenant utiliser:
echo   npm run dev    - Pour démarrer le serveur de développement
echo   npm run build  - Pour construire pour la production
echo.
pause
