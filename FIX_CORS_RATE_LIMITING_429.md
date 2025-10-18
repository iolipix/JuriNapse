# 🛡️ Résolution des Problèmes CORS et Rate Limiting

## Problème Rencontré

Votre ami a rencontré les erreurs suivantes :
- `Blocage d'une requête multiorigines (Cross-Origin Request)` 
- `Code d'état : 429` (Too Many Requests)
- `l'en-tête CORS « Access-Control-Allow-Origin » est manquant`

## Causes Identifiées

1. **Rate Limiting Trop Strict** : L'API limitait à 1000 requêtes par 15 minutes globalement
2. **Ordre des Middlewares** : CORS était appliqué APRÈS le rate limiting
3. **Configuration CORS Incomplète** : Manquait des headers et options pour les requêtes preflight

## Solutions Appliquées

### 1. Augmentation des Limites de Rate Limiting

```javascript
// Avant
const apiLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  1000, // 1000 requêtes max
  'Trop de requêtes. Réessayez plus tard.'
);

// Après
const generalApiLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5000, // 5000 requêtes max - Très permissif pour navigation normale
  'Trop de requêtes. Réessayez plus tard.'
);
```

### 2. Réorganisation de l'Ordre des Middlewares

```javascript
// Ordre CORRECT :
app.use(helmetConfig);           // 1. Sécurité headers
app.use(mongoSanitize);          // 2. Protection injection
app.use(cors({...}));            // 3. CORS AVANT rate limiting
app.use('/api/posts', generalApiLimiter);    // 4. Rate limiting spécifique
app.use('/api/', apiLimiter);    // 5. Rate limiting général
```

### 3. Configuration CORS Complète

```javascript
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'https://www.jurinapse.com',
    // ... tous les domaines autorisés
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
}));

// Middleware spécial pour preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});
```

## Monitoring et Prévention

### Comment Diagnostiquer des Problèmes CORS

1. **Vérifier les Headers CORS** dans DevTools → Network
2. **Examiner les requêtes OPTIONS** (preflight)
3. **Contrôler l'ordre des middlewares** dans server.js
4. **Surveiller les logs de rate limiting**

### Limites Recommandées par Type de Route

```javascript
// Authentification (sensible)
authLimiter: 15 requêtes / 15 minutes

// Inscription (très sensible)  
registerLimiter: 3 requêtes / 1 heure

// Navigation générale (posts, profils)
generalApiLimiter: 5000 requêtes / 15 minutes

// API générale
apiLimiter: 2000 requêtes / 15 minutes
```

### Domaines Autorisés

Toujours maintenir la cohérence entre :
- Configuration CORS Express
- Configuration CORS Socket.io
- Domaines frontend déployés

## Commandes de Déploiement

Après ces modifications, redéployez avec :

```bash
# Railway
railway deploy

# Ou si auto-deploy activé, pushez vers main
git add .
git commit -m "fix: amélioration CORS et rate limiting pour éviter erreurs 429"
git push origin main
```

## Tests de Validation

1. **Test CORS** : Ouvrir DevTools → Console, vérifier absence d'erreurs CORS
2. **Test Rate Limiting** : Navigation intensive, vérifier pas d'erreurs 429
3. **Test Preflight** : Examiner requêtes OPTIONS dans Network tab

---

**Date de résolution** : 19 octobre 2025  
**Problème** : Erreurs CORS 429 bloquant l'accès aux API  
**Status** : ✅ Résolu