# 🔍 Diagnostic des Déconnexions Automatiques

## 🚨 Problème Identifié

**Double système d'authentification non synchronisé :**
- Backend : Cookies HTTP sécurisés (`httpOnly: true`, 7 jours)
- Frontend : localStorage comme fallback
- **Résultat** : Désynchronisation → déconnexions inexpliquées

## 🔧 Solutions Proposées

### 1. Système de Debugging Avancé

Ajouter un middleware pour diagnostiquer les déconnexions :

```typescript
// Frontend - Debug auth state
const debugAuthState = () => {
  const hasLocalToken = !!localStorage.getItem('jurinapse_token');
  const cookieString = document.cookie;
  const hasJurinapseCookie = cookieString.includes('jurinapse_token');
  
  console.log('🔍 [AUTH DEBUG]', {
    localStorage: hasLocalToken ? 'présent' : 'absent',
    cookies: hasJurinapseCookie ? 'présent' : 'absent',
    cookieString: cookieString || 'aucun cookie',
    timestamp: new Date().toISOString()
  });
};
```

### 2. Synchronisation localStorage <-> Cookies

```typescript
// Vérifier la cohérence auth à chaque navigation
const checkAuthCoherence = async () => {
  try {
    const profileResponse = await api.get('/auth/profile');
    if (!profileResponse.data.success) {
      // Cookie invalide mais localStorage pourrait être présent
      localStorage.removeItem('jurinapse_token');
      setUser(null);
    }
  } catch (error) {
    // API refuse = pas authentifié
    localStorage.removeItem('jurinapse_token');
    setUser(null);
  }
};
```

### 3. Cookie Auto-Refresh

```typescript
// Backend - Rafraîchir cookie à chaque requête authentifiée
const refreshCookieMiddleware = (req, res, next) => {
  if (req.user) {
    // Renouveler le cookie si utilisateur authentifié
    const token = jwt.sign(
      { userId: req.user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    setJwtCookie(res, token);
  }
  next();
};
```

## 🎯 Causes Probables de Vos Déconnexions

### A. Navigation Privée / Incognito
- **Symptôme** : Déconnecté à chaque fermeture navigateur
- **Cause** : Cookies effacés automatiquement
- **Solution** : Message utilisateur explicatif

### B. Cache Navigateur Vidé
- **Symptôme** : Déconnecté après "Clear Cache"
- **Cause** : localStorage supprimé
- **Solution** : Vérification cohérence au load

### C. Expiration Cookie vs localStorage
- **Symptôme** : Interface dit "connecté" mais API refuse
- **Cause** : localStorage présent, cookie expiré
- **Solution** : Validation token à chaque requête critique

### D. Problèmes Cross-Origin
- **Symptôme** : Déconnecté sur certains domaines
- **Cause** : Cookies pas envoyés cross-origin
- **Solution** : Configuration CORS + SameSite

## 📊 Plan de Diagnostic

### Étape 1 : Monitoring
```javascript
// Ajouter dans AuthContext
useEffect(() => {
  const interval = setInterval(() => {
    debugAuthState();
  }, 30000); // Check toutes les 30s
  
  return () => clearInterval(interval);
}, []);
```

### Étape 2 : Détection Automatique
```javascript
// Détecter incohérences
const detectAuthInconsistency = () => {
  const hasLocalToken = !!localStorage.getItem('jurinapse_token');
  const userInState = !!user;
  
  if (hasLocalToken !== userInState) {
    console.warn('⚠️ Incohérence auth détectée:', {
      localStorage: hasLocalToken,
      userState: userInState
    });
    
    // Auto-correction
    if (!hasLocalToken && userInState) {
      setUser(null); // Forcer déconnexion
    }
  }
};
```

### Étape 3 : Logs Serveur
```javascript
// Backend - Logger les déconnexions
app.use('/api', (req, res, next) => {
  const hasCookie = !!req.cookies.jurinapse_token;
  const hasHeader = !!req.headers.authorization;
  
  if (!hasCookie && !hasHeader && req.path !== '/auth/login') {
    console.log('🚪 [AUTH] Requête non authentifiée:', {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
  
  next();
});
```

## 🛠️ Actions Immédiates

1. **Debugging** : Activer logs détaillés auth
2. **Monitoring** : Surveiller patterns de déconnexion
3. **Cohérence** : Vérifier auth state à chaque navigation
4. **Communication** : Expliquer aux utilisateurs (navigation privée, etc.)

---

**Prochaine étape** : Implémenter le système de debugging pour identifier précisément votre cas !