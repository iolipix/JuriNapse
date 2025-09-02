@echo off
echo Installation complète des dépendances JuriNapse...
echo.

echo =============================================
echo Installation Frontend
echo =============================================
cd /d "%~dp0frontend"
echo Répertoire: %CD%
call npm install
if errorlevel 1 (
    echo ERREUR: Installation frontend échouée
    pause
    exit /b 1
)

echo.
echo =============================================
echo Installation Backend  
echo =============================================
cd /d "%~dp0backend"
echo Répertoire: %CD%
call npm install
if errorlevel 1 (
    echo ERREUR: Installation backend échouée
    pause
    exit /b 1
)

echo.
echo =============================================
echo Installation des dépendances racine
echo =============================================
cd /d "%~dp0"
echo Répertoire: %CD%
call npm install
if errorlevel 1 (
    echo ERREUR: Installation racine échouée
    pause
    exit /b 1
)

echo.
echo ✅ Installation terminée avec succès !
echo.
echo Commandes disponibles:
echo   Frontend: cd frontend && npm run dev
echo   Backend:  cd backend && npm start
echo.
pause
