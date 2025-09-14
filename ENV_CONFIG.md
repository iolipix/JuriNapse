# Configuration Environnement - JuriNapse

## 🚀 Production (Railway)

Les variables d'environnement sont configurées directement dans Railway Dashboard.

### Variables nécessaires :
- `MONGODB_URI` - URI complète de MongoDB
- `DB_NAME` - Nom de la base de données  
- `NODE_ENV=production`
- `PORT=5000`
- `LOG_LEVEL=minimal`

## 💻 Développement Local

### Option 1: Variables d'environnement système
Définissez les variables directement dans votre système.

### Option 2: Fichier .env local
```bash
# Copiez le template
cp backend/.env.local backend/.env

# Éditez backend/.env avec vos valeurs de développement
```

## 🔒 Sécurité

✅ **CE QUI EST SÉCURISÉ :**
- Variables sensibles uniquement dans Railway
- Fichier `.env` dans `.gitignore`
- Templates sans vraies valeurs

❌ **À ÉVITER :**
- Jamais de credentials dans le code source
- Jamais committer un `.env` avec de vraies valeurs

## 🛠️ Scripts Utiles

```bash
# Vérifier la configuration
node check-environment.js

# Test avec base de données (nécessite config)
node test-premium-user.js
```

## 📁 Structure des Fichiers

```
backend/
├── .env.example     # Template public
├── .env.local       # Template développement  
├── .env            # Vos valeurs (ignoré par Git)
└── config/         # Fichiers de configuration
```