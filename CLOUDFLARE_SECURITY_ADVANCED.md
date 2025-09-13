# 🛡️ Configuration Sécurité Avancée Cloudflare - JuriNapse

## 🎯 Guide étape par étape pour optimiser la sécurité

### 📋 **Étape 1 : Accéder au Dashboard Cloudflare**

1. **Connectez-vous** : https://dash.cloudflare.com
2. **Sélectionnez votre domaine** : `jurinapse.com`
3. **Vérifiez le statut** : Domaine doit être "Active" ✅

---

## 🔥 **Étape 2 : Activer le WAF (Web Application Firewall)**

### **Navigation :**
```
Dashboard → Security → WAF
```

### **Configuration recommandée :**

#### **2.1 WAF Managed Rules**
```bash
✅ Cloudflare Managed Ruleset : ON
✅ Cloudflare OWASP Core Ruleset : ON  
✅ Cloudflare Exposed Credentials Check : ON
```

#### **2.2 Sensitivity Level**
```bash
Niveau recommandé : MEDIUM
- Low = Moins strict (plus de faux positifs)
- Medium = Équilibré (RECOMMANDÉ)
- High = Très strict (peut bloquer légitimes)
```

#### **2.3 Action par défaut**
```bash
Action : Challenge (CAPTCHA)
Alternative : Block (plus strict)
```

---

## 🚫 **Étape 3 : Configurer les Règles de Pare-feu Spécifiques**

### **Navigation :**
```
Dashboard → Security → WAF → Custom rules
```

### **3.1 Règle Anti-Spam Login**
```javascript
Nom de la règle : "Protection Login JuriNapse"
Expression : 
(http.request.uri.path contains "/api/auth/login" and 
 http.request.method eq "POST" and 
 ip.geoip.country ne "FR" and 
 ip.geoip.country ne "BE" and 
 ip.geoip.country ne "CH")

Action : Challenge
```

### **3.2 Règle Protection Admin**
```javascript
Nom de la règle : "Protection Zone Admin"
Expression :
(http.request.uri.path contains "/admin" and 
 not ip.src in {VOTRE_IP_FIXE})

Action : Block
Remplacez VOTRE_IP_FIXE par votre IP
```

### **3.3 Règle Anti-Injection**
```javascript
Nom de la règle : "Protection Injection"
Expression :
(http.request.body contains "script" or 
 http.request.body contains "javascript:" or 
 http.request.body contains "onload=" or
 http.request.body contains "onerror=")

Action : Block
```

### **3.4 Règle Rate Limiting Avancé**
```javascript
Nom de la règle : "Rate Limit API Strict"
Expression :
http.request.uri.path contains "/api/"

Action : Block
Rate : 250 requests per 15 minutes (1000/heure)
Par IP
```

---

## 🤖 **Étape 4 : Activer la Protection Bot Avancée**

### **Navigation :**
```
Dashboard → Security → Bots
```

### **4.1 Bot Fight Mode**
```bash
✅ Activer Bot Fight Mode
Mode : Super Bot Fight Mode (si disponible dans votre plan)
```

### **4.2 Configuration Bot Rules**
```bash
✅ Definitely automated : Block
✅ Likely automated : Challenge  
✅ Verified bots (Google, etc.) : Allow
```

### **4.3 JavaScript Detections**
```bash
✅ Challenge/Block les requêtes sans JavaScript
✅ Détecter les navigateurs headless
```

---

## 🚨 **Étape 5 : Configurer les Alertes de Sécurité**

### **5.1 Notifications par Email**
```
Dashboard → Notifications → Add
```

**Alertes à configurer :**

#### **Alerte DDoS**
```bash
Type : HTTP DDoS Attack Alerter
Seuil : Medium sensitivity
Email : votre-email@example.com
```

#### **Alerte WAF**
```bash
Type : WAF Events Alerter  
Conditions : 
- Actions = Block
- Requests > 100 per hour
Email : votre-email@example.com
```

#### **Alerte Trafic Suspect**
```bash
Type : Traffic Anomalies
Conditions :
- Unusual increase in traffic
- Suspicious user agents
Email : votre-email@example.com
```

### **5.2 Webhook (Optionnel)**
```bash
URL : https://jurinapse.com/api/security/webhook
Format : JSON
Events : All security events
```

---

## 📊 **Étape 6 : Configuration SSL/TLS Renforcée**

### **Navigation :**
```
Dashboard → SSL/TLS → Overview
```

### **Configuration recommandée :**
```bash
SSL/TLS encryption mode : Full (strict) ✅
Min TLS Version : TLS 1.2 ✅  
TLS 1.3 : Enabled ✅
HSTS : Enabled ✅
Always Use HTTPS : ON ✅
```

---

## 🔒 **Étape 7 : Protection DDoS Avancée**

### **Navigation :**
```
Dashboard → Security → DDoS
```

### **Configuration :**
```bash
✅ HTTP DDoS attack protection : ON
✅ L3/4 DDoS attack protection : ON  
Sensitivity : Medium
```

---

## 📈 **Étape 8 : Monitoring et Analytics**

### **8.1 Security Analytics**
```
Dashboard → Analytics → Security
```

**Surveiller :**
- Requêtes bloquées par heure
- Top des menaces
- Géolocalisation des attaques

### **8.2 Logs en Temps Réel**
```bash
Plan Pro+ requis pour :
- Real-time logs
- Log retention étendue
```

---

## ✅ **Checklist de Vérification**

Après configuration, vérifiez :

- [ ] WAF activé et configuré
- [ ] Rules custom créées et testées  
- [ ] Bot protection active
- [ ] Alertes email configurées
- [ ] SSL/TLS en mode strict
- [ ] DDoS protection activée
- [ ] Analytics Security visibles

---

## 🧪 **Tests de Validation**

### **Test 1 : WAF**
```bash
# Test injection (doit être bloqué)
curl -X POST https://jurinapse.com/api/test \
  -d "test=<script>alert('xss')</script>"
```

### **Test 2 : Rate Limiting**
```bash
# 50 requêtes rapides (les dernières doivent être bloquées)
for i in {1..50}; do curl https://jurinapse.com/api/posts; done
```

### **Test 3 : Bot Detection**
```bash
# Requête avec user-agent suspect
curl -H "User-Agent: BadBot/1.0" https://jurinapse.com
```

---

## 🆘 **Aide en Cas de Problème**

### **Site inaccessible après config :**
1. Dashboard → Security → WAF → Custom rules
2. Désactiver temporairement les rules custom
3. Tester l'accès au site
4. Réactiver une par une

### **Trop de faux positifs :**
1. Baisser sensitivity (High → Medium → Low)
2. Ajouter exceptions pour IPs légitimes
3. Analyser les logs pour comprendre

### **Support Cloudflare :**
- Documentation : https://developers.cloudflare.com/
- Community : https://community.cloudflare.com/

---

**🎯 Résultat attendu :** Protection multicouche avec monitoring complet des menaces pour JuriNapse.
