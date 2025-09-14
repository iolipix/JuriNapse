# Configuration pour Railway

## Variables d'environnement à configurer dans Railway Dashboard

Allez dans Railway Dashboard > Votre projet > Variables et ajoutez :

### MongoDB Configuration
- `MONGODB_URI` = votre URI MongoDB complète
- `DB_USER` = nom d'utilisateur MongoDB  
- `DB_PASSWORD` = mot de passe MongoDB
- `DB_CLUSTER` = URL du cluster MongoDB
- `DB_APP_NAME` = jurinapse
- `DB_NAME` = jurinapse

### Server Configuration  
- `NODE_ENV` = production
- `PORT` = 5000
- `LOG_LEVEL` = minimal

## Développement local

Pour le développement local, créez un fichier `.env` dans `backend/` avec vos valeurs de développement (base de données locale ou de test).

Le fichier `.env` est déjà dans le `.gitignore` donc il ne sera jamais commité.

## Sécurité

✅ Variables sensibles dans Railway uniquement
✅ Pas de credentials dans le code source
✅ .env dans .gitignore
✅ Fichier .env.example pour la documentation