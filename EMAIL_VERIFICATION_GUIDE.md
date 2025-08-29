# Système de Vérification Email - Guide d'utilisation

## 📋 Aperçu

Le système de vérification email permet de s'assurer que les utilisateurs possèdent bien l'adresse email qu'ils ont fournie lors de l'inscription.

## 🏗️ Architecture

### Fichiers créés :
- `models/verificationToken.model.js` - Modèle MongoDB pour les tokens
- `services/token.service.js` - Service de gestion des tokens
- `services/email.service.js` - Service d'envoi d'emails avec Resend
- `controllers/verification.controller.js` - Contrôleur pour les routes de vérification
- `routes/verification.routes.js` - Routes de vérification

### Fichiers modifiés :
- `controllers/auth.controller.js` - Intégration vérification lors inscription/connexion
- `routes/auth.routes.js` - Ajout des routes de vérification
- `.env` - Configuration Resend et URLs

## 🔧 Configuration

### Variables d'environnement à configurer :

```bash
# Resend (service email)
RESEND_API_KEY=your_resend_api_key_here
FROM_EMAIL=noreply@jurinapse.com
FROM_NAME=Jurinapse

# URL du frontend pour les liens de vérification
FRONTEND_URL=http://localhost:3000
```

### Installation des dépendances :
```bash
npm install resend express-rate-limit
```

## 📡 API Endpoints

### POST `/api/auth/send-verification`
Envoie un email de vérification à l'utilisateur

**Body :**
```json
{
  "email": "user@example.com"
}
```

**Limite :** 3 tentatives par heure par IP/email

### GET `/api/auth/verify?token=TOKEN`
Vérifie le compte via le token (redirection automatique)

**Query params :**
- `token` : Token de vérification reçu par email

**Limite :** 10 tentatives par 15 minutes par IP

### POST `/api/auth/resend-verification`
Renvoie un email de vérification

**Body :**
```json
{
  "email": "user@example.com"
}
```

### GET `/api/auth/verification-status?email=EMAIL`
Vérifie le statut de vérification d'un compte

**Response :**
```json
{
  "success": true,
  "data": {
    "email": "user@example.com",
    "isVerified": true,
    "verifiedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

## 🔄 Flux d'utilisation

### 1. Inscription
1. L'utilisateur s'inscrit avec email/mot de passe
2. Le compte est créé avec `isVerified: false`
3. Un email de vérification est envoyé automatiquement
4. L'utilisateur reçoit un JWT mais ne peut pas se connecter tant que non vérifié

### 2. Vérification
1. L'utilisateur clique sur le lien dans l'email
2. Le token est vérifié et consommé (usage unique)
3. Le compte passe à `isVerified: true`
4. Redirection vers le frontend avec message de succès
5. Email de bienvenue envoyé (optionnel)

### 3. Connexion
1. L'utilisateur essaie de se connecter
2. Vérification des identifiants
3. Vérification que `isVerified === true`
4. Si non vérifié : erreur 403 avec possibilité de renvoyer l'email

## 🛡️ Sécurité

### Protection contre le spam :
- **Rate limiting :** 3 emails par heure maximum
- **Tokens sécurisés :** 32 bytes aléatoires cryptographiques
- **Expiration :** Tokens valides 1 heure seulement
- **Usage unique :** Tokens supprimés après utilisation
- **Nettoyage automatique :** TTL MongoDB de 1 heure

### Gestion des erreurs :
- Pas de révélation d'existence d'email lors de l'envoi
- Messages d'erreur génériques
- Logs détaillés côté serveur uniquement

## 📧 Templates d'emails

### Email de vérification :
- **Sujet :** "Vérifiez votre compte Jurinapse"
- **Contenu :** Lien de vérification + instructions
- **Expiration :** 1 heure

### Email de bienvenue :
- **Sujet :** "Bienvenue sur Jurinapse !"
- **Contenu :** Message de bienvenue + liens utiles
- **Envoyé :** Après vérification réussie

## 🧪 Tests

Lancer les tests du système :
```bash
node test-email-verification.js
```

Tests inclus :
- Génération de tokens
- Vérification de tokens
- Nettoyage des tokens expirés
- Statistiques
- Simulation d'envoi d'emails

## 🔧 Maintenance

### Nettoyage automatique :
- Les tokens expirent automatiquement après 1 heure (TTL MongoDB)
- Pas de maintenance manuelle nécessaire

### Surveillance :
- Logs détaillés pour chaque étape
- Statistiques disponibles via `/api/auth/token-stats`
- Monitoring des erreurs d'envoi d'email

## 🚨 Problèmes courants

### Email non reçu :
1. Vérifier la configuration Resend
2. Vérifier les logs serveur
3. Vérifier le dossier spam
4. Utiliser `/resend-verification`

### Token invalide/expiré :
1. Demander un nouveau token
2. Vérifier que le lien n'a pas été utilisé
3. Vérifier l'expiration (1 heure max)

### Limites de taux atteintes :
1. Attendre la fin de la période
2. Vérifier les tentatives multiples
3. Contacter l'administrateur si nécessaire

## 📋 Todo / Améliorations possibles

- [ ] Interface admin pour gérer les vérifications
- [ ] Statistiques avancées (taux de vérification, etc.)
- [ ] Support multi-langues pour les emails
- [ ] Personnalisation des templates
- [ ] Webhooks pour événements de vérification
- [ ] 2FA en option après vérification email
