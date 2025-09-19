# Guide de Configuration Stripe pour JuriNapse Premium

## 📋 Étapes de Configuration

### 1. Configuration Stripe Dashboard

1. **Créer un compte Stripe** (si pas déjà fait)
   - Aller sur https://stripe.com
   - Créer un compte business

2. **Créer un produit Premium**
   - Dashboard Stripe → Produits → Créer un produit
   - Nom : "JuriNapse Premium"
   - Description : "Abonnement premium avec fonctionnalités exclusives"

3. **Créer un prix d'abonnement**
   - Prix mensuel : 9.99€/mois
   - Période d'essai : 7 jours gratuits
   - Récurrence : Mensuelle
   - Copier le `price_id` (ex: price_1234...)

4. **Configurer les Webhooks**
   - Dashboard Stripe → Webhooks → Ajouter un endpoint
   - URL : `https://your-domain.com/api/stripe/webhook`
   - Événements à écouter :
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

### 2. Variables d'Environnement Backend

Ajouter au fichier `.env` :

```env
# Configuration Stripe
STRIPE_SECRET_KEY=sk_test_...  # Clé secrète Stripe (mode test)
STRIPE_PUBLISHABLE_KEY=pk_test_...  # Clé publique Stripe (mode test)
STRIPE_WEBHOOK_SECRET=whsec_...  # Secret webhook Stripe
STRIPE_PRICE_ID=price_...  # ID du prix de l'abonnement premium

# URLs de redirection
FRONTEND_URL=http://localhost:3000  # URL du frontend pour les redirections
```

### 3. Variables d'Environnement Frontend

Ajouter au fichier `.env` du frontend :

```env
# Configuration Stripe Frontend
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Clé publique Stripe
```

### 4. Installation des Dépendances

Backend :
```bash
npm install stripe
```

Frontend :
```bash
npm install @stripe/stripe-js
```

## 🔧 Configuration en Production

### 1. Stripe Production
- Activer le compte Stripe en production
- Remplacer les clés test par les clés live
- Configurer les webhooks en production

### 2. Environnement de Production
```env
# Variables d'environnement production
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=https://jurinapse.com
```

## 🧪 Tests

### 1. Cartes de Test Stripe
- Carte valide : `4242 4242 4242 4242`
- Date d'expiration : toute date future
- CVC : tout code à 3 chiffres

### 2. Test des Webhooks
- Utiliser l'outil Stripe CLI : `stripe listen --forward-to localhost:3001/api/stripe/webhook`
- Tester les événements d'abonnement

## 📁 Fichiers Créés/Modifiés

### Backend
- `backend/services/stripe.service.js` - Service Stripe principal
- `backend/routes/stripe.js` - Routes API Stripe
- `backend/routes/stripe-webhook.js` - Gestion des webhooks
- `backend/models/user.model.js` - Champs Stripe ajoutés
- `backend/server.js` - Routes Stripe intégrées

### Frontend
- `frontend/src/components/Premium/PremiumSubscriptionPage.tsx` - Interface d'abonnement
- `frontend/src/components/Premium/PremiumSuccessPage.tsx` - Page de succès
- `frontend/src/components/Premium/PremiumCancelPage.tsx` - Page d'annulation
- `frontend/src/services/api.ts` - API Stripe intégrée
- `frontend/src/components/Layout/Sidebar.tsx` - Onglet Premium ajouté

## 🚀 Déploiement

### 1. Railway
- Variables d'environnement configurées dans Railway
- URL webhook mise à jour avec le domaine de production

### 2. Tests de Production
- Vérifier les redirections Stripe
- Tester les webhooks en production
- Valider l'activation/désactivation premium

## 🔒 Sécurité

- Clés secrètes stockées uniquement côté serveur
- Validation des signatures webhook
- Authentification requise pour toutes les routes Stripe
- Gestion des erreurs et logs sécurisés

## 📞 Support

En cas de problème :
1. Vérifier les logs Stripe Dashboard
2. Contrôler les variables d'environnement
3. Tester avec les cartes de test Stripe
4. Vérifier la configuration des webhooks

## 💡 Fonctionnalités Implémentées

✅ Création d'abonnements premium
✅ Gestion du portail client Stripe
✅ Webhooks automatiques pour la synchronisation
✅ Pages de succès et d'annulation
✅ Intégration dans l'interface utilisateur
✅ Gestion des erreurs et états de chargement
✅ Support de la période d'essai gratuite
✅ Annulation d'abonnement
✅ Historique premium avec audit trail