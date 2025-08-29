# 🎯 Script de Validation Post-Déploiement

Ce script valide que le système de vérification email fonctionne correctement après déploiement.

## Usage

```bash
# Test en local
node validate-email-system.js http://localhost:5000

# Test en production  
node validate-email-system.js https://jurinapse.com
```

## Tests effectués

1. ✅ Vérification des endpoints d'authentification
2. ✅ Test d'inscription avec vérification email
3. ✅ Test des routes de vérification
4. ✅ Test des redirections
5. ✅ Validation de la sécurité (rate limiting)

## Résultats attendus

- Tous les endpoints répondent correctement
- Les emails sont envoyés (ou simulés)
- Les redirections fonctionnent
- Le rate limiting protège contre le spam
- Les comptes sont correctement activés
