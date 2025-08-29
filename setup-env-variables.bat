@echo off
echo 🔧 Configuration des variables d'environnement MongoDB
echo =====================================================

echo.
echo ATTENTION: Ce fichier contient un template pour les variables d'environnement.
echo Modifiez les valeurs ci-dessous avec vos vraies informations avant d'exécuter.
echo.

echo Création des variables d'environnement utilisateur...

REM Remplacez ces valeurs par vos vraies informations MongoDB
setx DB_USER "YOUR_MONGODB_USERNAME_HERE"
setx DB_PASSWORD "YOUR_MONGODB_PASSWORD_HERE"
setx DB_CLUSTER "YOUR_MONGODB_CLUSTER_HERE.mongodb.net"
setx DB_APP_NAME "YOUR_APP_NAME_HERE"

echo.
echo ✅ Variables d'environnement créées avec succès !
echo.
echo Les variables suivantes ont été définies :
echo - DB_USER = [CONFIGURÉ]
echo - DB_PASSWORD = [MASQUÉ]
echo - DB_CLUSTER = [CONFIGURÉ]
echo - DB_APP_NAME = [CONFIGURÉ]
echo.
echo ⚠️  IMPORTANT : Redémarrez VS Code pour que les nouvelles variables soient prises en compte !
echo.
pause
