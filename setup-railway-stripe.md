# Configuration Stripe sur Railway

## Variables d'environnement à ajouter

Connectez-vous sur Railway et ajoutez ces variables d'environnement dans votre projet :

### 1. STRIPE_SECRET_KEY
```
STRIPE_SECRET_KEY=sk_test_VOTRE_CLE_SECRETE_STRIPE
```
**Où la trouver :** Dashboard Stripe > Developers > API keys > Secret key

### 2. STRIPE_PUBLISHABLE_KEY  
```
STRIPE_PUBLISHABLE_KEY=pk_test_VOTRE_CLE_PUBLIQUE_STRIPE
```
**Où la trouver :** Dashboard Stripe > Developers > API keys > Publishable key

### 3. STRIPE_PREMIUM_PRICE_ID
```
STRIPE_PREMIUM_PRICE_ID=price_VOTRE_ID_PRIX_PREMIUM
```
**Comment l'obtenir :**
1. Dashboard Stripe > Products
2. Créer un produit "Premium JuriNapse" 
3. Ajouter un prix récurrent (ex: 9.99€/mois)
4. Copier l'ID du prix (commence par `price_`)

### 4. STRIPE_WEBHOOK_SECRET (pour plus tard)
```
STRIPE_WEBHOOK_SECRET=whsec_VOTRE_SECRET_WEBHOOK
```
**Comment l'obtenir :**
1. Dashboard Stripe > Developers > Webhooks
2. Créer un endpoint : `https://votre-app.railway.app/api/stripe/webhook`
3. Copier le secret de signing

## Commandes Railway CLI (optionnel)

Si vous avez Railway CLI installé :

```bash
railway login
railway variables set STRIPE_SECRET_KEY=sk_test_...
railway variables set STRIPE_PUBLISHABLE_KEY=pk_test_...
railway variables set STRIPE_PREMIUM_PRICE_ID=price_...
```

## Test après configuration

Une fois configuré, le serveur devrait démarrer sans erreur et vous pourrez tester l'abonnement premium.