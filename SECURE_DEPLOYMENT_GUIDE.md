# 🔐 Guide de Déploiement Sécurisé - Railway & Vercel

## ⚠️ SÉCURITÉ - Variables d'environnement

**JAMAIS commiter les vraies clés API dans Git !**

### 📁 Fichiers sécurisés (exclus de Git)
- `.env` - Configuration locale
- `config/.env` - Configuration serveur
- Toute clé API ou mot de passe

### 📁 Fichiers safe pour Git
- `.env.example` - Templates sans vraies valeurs
- `config/.env.example` - Templates de production

## 🚀 Configuration Railway (Backend)

### 1. Variables d'environnement Railway
Dans le dashboard Railway, configurer :

```bash
# MongoDB
MONGODB_URI=mongodb+srv://[USERNAME]:[PASSWORD]@[CLUSTER]/[DB_NAME]?retryWrites=true&w=majority&appName=[APP_NAME]
DB_USER=[YOUR_DB_USERNAME]
DB_PASSWORD=[YOUR_DB_PASSWORD]
DB_CLUSTER=[YOUR_CLUSTER_URL]
DB_APP_NAME=[YOUR_APP_NAME]
DB_NAME=[YOUR_DATABASE_NAME]

# Email Resend
RESEND_API_KEY=[YOUR_RESEND_API_KEY]
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=YourAppName

# URLs
FRONTEND_URL=https://yourapp.vercel.app

# Environnement
NODE_ENV=production
PORT=5000
```

### 2. Configuration Railway
1. Connecter le repo GitHub
2. Sélectionner la branche `main`
3. Railway détectera automatiquement Node.js
4. Ajouter les variables d'environnement dans l'onglet "Variables"
5. Déploiement automatique à chaque push

## ☁️ Configuration Vercel (Frontend)

### 1. Variables d'environnement Vercel
Dans le dashboard Vercel :

```bash
# API Backend
NEXT_PUBLIC_API_URL=https://votre-app.railway.app

# Autres variables frontend si nécessaire
NEXT_PUBLIC_FRONTEND_URL=https://jurinapse.vercel.app
```

### 2. Configuration Vercel
1. Importer le projet depuis GitHub
2. Sélectionner le framework (Next.js/React)
3. Configurer le répertoire racine si nécessaire
4. Ajouter les variables d'environnement
5. Déploiement automatique

## 🔧 Script de déploiement

### Pre-deploy checklist
```bash
# Vérifier que les secrets ne sont pas dans le code
git log --oneline -10 | grep -i "key\|password\|secret"

# Vérifier .gitignore
git status --ignored

# Tester en local avec les vraies clés
node test-integration-complete.js
```

## 🌐 URLs de production

### Backend (Railway)
```
https://votre-app.railway.app/api/auth/verify
https://votre-app.railway.app/api/auth/send-verification
```

### Frontend (Vercel)
```
https://jurinapse.vercel.app
https://jurinapse.vercel.app/auth/login
https://jurinapse.vercel.app/auth/register
```

## 🔐 Gestion des secrets

### Rotation des clés
1. **Resend** : Révoquer l'ancienne, générer nouvelle
2. **MongoDB** : Changer mot de passe utilisateur
3. **Mettre à jour** : Railway + Vercel en même temps

### Monitoring sécurité
- Surveiller les logs d'accès suspect
- Alertes sur échecs d'authentification
- Monitoring utilisation API Resend

## 🧪 Tests de production

### Après déploiement
```bash
# Tester les endpoints
node validate-email-system.js https://votre-app.railway.app

# Tester l'inscription complète
curl -X POST https://votre-app.railway.app/api/auth/send-verification \
  -H "Content-Type: application/json" \
  -d '{"email":"test@votredomaine.com"}'
```

## 🚨 En cas de compromission

### Actions d'urgence
1. **Révoquer** immédiatement la clé Resend
2. **Changer** tous les mots de passe MongoDB
3. **Redéployer** avec nouvelles clés
4. **Auditer** les logs d'accès
5. **Informer** les utilisateurs si nécessaire

### Prévention
- Jamais partager les clés par email/chat
- Utiliser des outils de rotation automatique
- Limiter l'accès aux dashboards (2FA)
- Surveiller les commits pour détecter les fuites

---

## ✅ Checklist déploiement sécurisé

- [ ] `.env` dans `.gitignore` ✅
- [ ] Variables configurées Railway ✅
- [ ] Variables configurées Vercel ✅
- [ ] Tests locaux avec vraies clés ✅
- [ ] Pas de secrets dans le code ✅
- [ ] Monitoring activé ✅
- [ ] Plan de rotation des clés ✅

**🎯 Statut : Prêt pour déploiement sécurisé !**
