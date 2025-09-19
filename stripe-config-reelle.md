# Configuration Stripe avec vraies clés de test

## Variables d'environnement pour Railway

```bash
# Clé secrète Stripe (TEST)
STRIPE_SECRET_KEY=sk_test_51S99PoC7f4ITcTzZ8gVfZYdSoT8tPeNRxuJ5AOwmuWWCvXnlRIJnZQwAUxAF9dtmXq78MXQWXmLxkRkHtQ0tBs1300VPA8cqHS

# Clé publique Stripe (à déterminer)
STRIPE_PUBLISHABLE_KEY=pk_test_... # À récupérer depuis le dashboard Stripe

# Lookup key pour le produit Premium
STRIPE_PREMIUM_LOOKUP_KEY=Premium-52dc2dc

# Prix : 3,00 €/mois
# Webhook secret (à configurer plus tard)
STRIPE_WEBHOOK_SECRET=whsec_... # À récupérer après configuration webhook
```

## Configuration sur Railway

1. Aller sur railway.app
2. Sélectionner votre projet JuriNapse
3. Aller dans Variables
4. Ajouter ces variables d'environnement

## Notes importantes

- **Prix** : 3,00 €/mois au lieu de 9,99 €/mois
- **Lookup key** : Utilise `Premium-52dc2dc` au lieu d'un price_id direct
- **Mode test** : Toutes les clés commencent par `sk_test_` et `pk_test_`