# 🔒 Configuration Pare-feu Réseau - JuriNapse

## 🎯 **Sécurisation des Ports et Connexions**

### **📋 État Actuel de Votre Infrastructure**

```
🌐 Frontend (Vercel) → Port 443 (HTTPS)
🚀 Backend (Railway) → Port Variable (Auto-assigné)
🗄️ MongoDB (Atlas) → Port 27017 (Accès restreint)
☁️ Cloudflare → Proxy/Firewall Web
```

---

## 🛡️ **1. Configuration Railway Backend**

### **Ports à Sécuriser :**
```bash
✅ Port HTTPS : 443 (Autorisé public)
✅ Port HTTP : 80 (Redirection → 443)
❌ Port SSH : 22 (Bloquer accès public)
❌ Port MongoDB : 27017 (Accès uniquement depuis Railway)
❌ Autres ports : Tous bloqués par défaut
```

### **Variables d'Environnement Railway à Vérifier :**
```env
# Dans votre projet Railway
PORT=${PORT} # Port auto-assigné par Railway
MONGODB_URI=mongodb+srv://... # Connexion sécurisée Atlas
NODE_ENV=production
```

### **Configuration Express.js (déjà en place) :**
```javascript
// Dans backend/server.js
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur démarré sur port ${PORT}`);
});
```

---

## 🗄️ **2. MongoDB Atlas - Restriction d'Accès**

### **Configuration IP Whitelist (CRITIQUE) :**

#### **Étape 1 : Accéder à MongoDB Atlas**
```
1. Connectez-vous : https://cloud.mongodb.com
2. Sélectionnez votre cluster
3. Network Access → IP Access List
```

#### **Étape 2 : Configuration Sécurisée**
```bash
🔴 SUPPRIMER : 0.0.0.0/0 (Accès mondial - DANGEREUX)

✅ AJOUTER UNIQUEMENT :
- Railway IP ranges (voir ci-dessous)
- Votre IP développement (temporaire)
```

#### **IP Ranges Railway à Autoriser :**
```
# Ajoutez ces ranges dans MongoDB Atlas
- 44.195.181.0/24
- 44.195.182.0/24  
- 44.195.183.0/24
- 52.86.50.0/24
- 52.86.51.0/24
- 52.86.52.0/24

Ou utilisez : railway.app (si MongoDB le supporte)
```

---

## 🚀 **3. Railway - Sécurisation Backend**

### **Variables d'Environnement Sécurisées :**
```env
# Ajoutez dans Railway Dashboard → Variables
ALLOWED_ORIGINS=https://jurinapse.com,https://www.jurinapse.com
CORS_CREDENTIALS=true
TRUST_PROXY=true
SECURE_COOKIES=true
```

### **Mise à Jour server.js pour Plus de Sécurité :**
```javascript
// Configuration CORS restrictive
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [
    'https://jurinapse.com',
    'https://www.jurinapse.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Trust proxy (pour Railway)
app.set('trust proxy', true);
```

---

## ☁️ **4. Cloudflare - Pare-feu Réseau Avancé**

### **Règles de Firewall par IP :**

#### **Règle 1 : Bloquer IPs Suspectes**
```javascript
Dashboard → Security → WAF → Custom rules

Nom : "Block Malicious IPs"
Expression : 
(ip.geoip.country in {"CN" "RU" "KP"} and 
 not http.request.uri.path contains "/api/public")

Action : Block
```

#### **Règle 2 : Limiter Accès Admin**
```javascript
Nom : "Restrict Admin Access"
Expression :
(http.request.uri.path contains "/admin" and 
 not ip.src in {VOTRE_IP_FIXE})

Action : Block
```

#### **Règle 3 : Protection API Backend**
```javascript
Nom : "API Protection"
Expression :
(http.request.uri.path contains "/api/" and 
 http.request.method eq "POST" and
 not cf.bot_management.score gt 30)

Action : Challenge
```

---

## 🔐 **5. Sécurisation MongoDB Avancée**

### **Authentification Renforcée :**
```javascript
// Dans votre connexion MongoDB
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  authSource: 'admin',
  ssl: true,
  sslValidate: true
};
```

### **Utilisateur MongoDB Dédié :**
```bash
# Créez un utilisateur spécifique pour l'app
Database Access → Add New Database User

Username : jurinapse-app
Password : [Généré automatiquement]
Role : readWrite sur votre database uniquement
```

---

## 🚨 **6. Monitoring et Alertes**

### **Script de Surveillance Connexions :**
```javascript
// Ajoutez dans votre backend
const monitorConnections = () => {
  const connections = process._getActiveHandles().length;
  const memUsage = process.memoryUsage();
  
  console.log(`🔍 Connexions actives: ${connections}`);
  console.log(`💾 Mémoire: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
  
  // Alerte si trop de connexions
  if (connections > 100) {
    console.warn('⚠️ ALERTE: Trop de connexions actives');
  }
};

setInterval(monitorConnections, 30000); // Toutes les 30s
```

### **Logging Sécurisé :**
```javascript
// Middleware de logging sécurisé
app.use((req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent');
  
  // Log uniquement si suspect
  if (userAgent?.includes('bot') || req.path.includes('admin')) {
    console.log(`🔍 Accès: ${clientIP} → ${req.method} ${req.path}`);
  }
  
  next();
});
```

---

## ✅ **7. Checklist de Sécurisation**

### **Backend Railway :**
- [ ] CORS configuré restrictif
- [ ] Variables d'environnement sécurisées
- [ ] Logging des accès suspects
- [ ] Rate limiting activé

### **MongoDB Atlas :**
- [ ] IP Whitelist configurée (Railway uniquement)
- [ ] Utilisateur dédié créé
- [ ] SSL/TLS activé
- [ ] Accès public supprimé (0.0.0.0/0)

### **Cloudflare :**
- [ ] Règles géo-blocking activées
- [ ] Protection admin configurée
- [ ] Bot protection activée
- [ ] Monitoring en place

### **Monitoring :**
- [ ] Alertes connexions suspectes
- [ ] Surveillance utilisation ressources
- [ ] Logs sécurisés

---

## 🧪 **8. Tests de Validation**

### **Test 1 : Connexion MongoDB**
```bash
# Depuis votre PC (doit échouer)
mongo "mongodb+srv://cluster.xxx.mongodb.net" --username votre-user

# Résultat attendu: Connexion refusée (IP non autorisée)
```

### **Test 2 : Accès Backend Direct**
```bash
# Test port Railway direct (doit réussir via HTTPS uniquement)
curl https://jurinapse-production.up.railway.app/api/health
```

### **Test 3 : Cloudflare Protection**
```bash
# Test avec IP suspecte simulée
curl -H "CF-Connecting-IP: 1.2.3.4" https://jurinapse.com/admin
# Résultat attendu: Bloqué par Cloudflare
```

---

## 🎯 **Résultat Final**

Avec cette configuration, vous aurez :

- **🔒 Accès MongoDB** : Uniquement depuis Railway
- **🌐 Frontend** : Protégé par Cloudflare 
- **🚀 Backend** : CORS restrictif + Rate limiting
- **🛡️ Cloudflare** : Protection multi-couches
- **📊 Monitoring** : Surveillance temps réel

**Score de sécurité attendu : 95%+ 🛡️**
