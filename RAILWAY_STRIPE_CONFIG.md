# ⚡ Configuration Railway - Variables Stripe

## Variables à ajouter sur Railway

Connecte-toi sur [railway.app](https://railway.app) et va dans ton projet JuriNapse.

### 1. Variables Stripe à ajouter :

```
STRIPE_SECRET_KEY=sk_test_51S99PoC7f4ITcTzZ8gVfZYdSoT8tPeNRxuJ5AOwmuWWCvXnlRIJnZQwAUxAF9dtmXq78MXQWXmLxkRkHtQ0tBs1300VPA8cqHS

STRIPE_PREMIUM_LOOKUP_KEY=Premium-52dc2dc
```

### 2. Variables à récupérer plus tard :

```
STRIPE_PUBLISHABLE_KEY=pk_test_... (à récupérer sur dashboard Stripe)

STRIPE_WEBHOOK_SECRET=whsec_... (à configurer après création webhook)
```

## Comment faire sur Railway :

1. 🔗 Va sur https://railway.app/dashboard
2. 📂 Sélectionne ton projet "JuriNapse"
3. ⚙️ Clique sur l'onglet "Variables"
4. ➕ Clique "New Variable"
5. 📝 Ajoute chaque variable une par une
6. 💾 Clique "Add" pour chaque variable

## Résultat attendu :

Une fois configuré, le serveur Railway devrait :
- ✅ Démarrer sans erreur Stripe
- ✅ Afficher la page Premium avec 3,00€/mois
- ✅ Permettre de tester l'abonnement (mode test)

## Test après config :

1. Va sur ton site Railway
2. Clique sur l'onglet Premium
3. Clique "Commencer l'essai gratuit"
4. Tu devrais être redirigé vers Stripe Checkout !