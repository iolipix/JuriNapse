@echo off
echo 🔧 Configuration des variables d'environnement MongoDB
echo =====================================================

echo.
echo Création des variables d'environnement utilisateur...

setx DB_USER "theophanemaurey"
setx DB_PASSWORD "YOUR_PASSWORD_HERE"
setx DB_CLUSTER "jurinapse.wbhqvq1.mongodb.net"
setx DB_APP_NAME "jurinapse"

echo.
echo ✅ Variables d'environnement créées avec succès !
echo.
echo Les variables suivantes ont été définies :
echo - DB_USER = theophanemaurey
echo - DB_PASSWORD = [MASQUÉ]
echo - DB_CLUSTER = jurinapse.wbhqvq1.mongodb.net
echo - DB_APP_NAME = jurinapse
echo.
echo ⚠️  IMPORTANT : Redémarrez VS Code pour que les nouvelles variables soient prises en compte !
echo.
pause
