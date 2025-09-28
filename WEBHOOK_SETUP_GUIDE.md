# 🎯 Configuration Webhook Stripe - Guide complet

## Étape 1 : Créer le webhook sur Stripe

1. **Va sur Stripe Dashboard** : https://dashboard.stripe.com/test/webhooks
2. **Clique "Add endpoint"**
3. **URL du webhook** : `https://ton-app.railway.app/api/stripe/webhook`
   - Remplace `ton-app.railway.app` par ton vraie URL Railway
4. **Description** : `JuriNapse Premium Subscriptions`

## Étape 2 : Sélectionner les événements

Coche ces événements (OBLIGATOIRES) :
- ✅ `checkout.session.completed`
- ✅ `customer.subscription.created` 
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`

## Étape 3 : Récupérer le secret

1. **Clique "Add endpoint"**
2. **Clique sur ton webhook créé**
3. **Section "Signing secret"** → **Reveal**
4. **Copie le secret** (commence par `whsec_...`)

## Étape 4 : Ajouter la variable sur Railway

**Variable** : `STRIPE_WEBHOOK_SECRET`
**Valeur** : `whsec_ton_secret_ici`

## Étape 5 : Test

1. Retourne sur Stripe Dashboard → Webhooks
2. Clique sur ton webhook 
3. Onglet "Testing" → "Send test webhook"
4. Choisis `checkout.session.completed`
5. Tu devrais voir "200 OK" ✅

## Résultat attendu :

Après configuration, quand quelqu'un paie :
1. 💳 Stripe traite le paiement
2. 📡 Stripe envoie un webhook à ton serveur  
3. 🔄 Ton serveur met à jour la base de données
4. ✅ L'utilisateur a automatiquement le statut premium

## URLs de ton projet :

- **Frontend** : https://jurinapse.com
- **Backend** : https://ton-app.railway.app  
- **Webhook** : https://ton-app.railway.app/api/stripe/webhook