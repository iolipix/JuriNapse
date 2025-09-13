# 🌐 Configuration DNS Cloudflare pour jurinapse.com

## 📋 Configuration DNS Exacte

### Enregistrements DNS à créer dans Cloudflare :

```dns
Type    Name    Content                                 Proxy   TTL
A       @       66.33.22.160                           ✅      Auto
A       www     66.33.22.160                           ✅      Auto
CNAME   api     jurinapse-production.up.railway.app    ✅      Auto
CNAME   app     juri-napse.vercel.app                  ✅      Auto
```

### Explication des enregistrements :
- **@** = jurinapse.com (domaine principal → Frontend Vercel)
- **www** = www.jurinapse.com (version www → Frontend Vercel)
- **api** = api.jurinapse.com (API Backend → Railway)
- **app** = app.jurinapse.com (Alternative frontend → Vercel)

## 🛠️ Instructions Étape par Étape

### 1. Dans Cloudflare Dashboard :
1. Sélectionner votre site `jurinapse.com`
2. Aller dans **DNS** → **Records**
3. Ajouter les 4 enregistrements ci-dessus

### 2. Changer les Nameservers :
Cloudflare vous donnera 2 nameservers comme :
```
ana.ns.cloudflare.com
rick.ns.cloudflare.com
```

**Chez votre registrar de domaine :**
1. Aller dans la gestion DNS de jurinapse.com
2. Remplacer les nameservers actuels par ceux de Cloudflare
3. Sauvegarder

### 3. Attendre la Propagation :
- **Temps** : 2-48 heures (souvent 2-6h)
- **Vérification** : Status "Active" dans Cloudflare

## ⚙️ Configuration Sécurité Immédiate

### SSL/TLS :
1. **SSL/TLS** → **Overview**
2. **Mode** : "Full (Strict)"
3. **Always Use HTTPS** : ON
4. **HSTS** : ON

### Firewall Basic :
1. **Security** → **WAF**
2. **Managed Rules** : ON
3. **Security Level** : Medium

### Performance :
1. **Speed** → **Optimization**
2. **Auto Minify** : JS, CSS, HTML = ON
3. **Brotli** : ON

## 🔄 Mise à Jour du Code

### Backend Railway - Variables à ajouter :
```bash
# Dans Railway Dashboard → Variables
FRONTEND_URL=https://jurinapse.com
CORS_ORIGIN=https://jurinapse.com,https://www.jurinapse.com
```

### Frontend Vercel - Variables à mettre à jour :
```bash
# Dans Vercel Dashboard → Variables
VITE_API_BASE_URL=https://api.jurinapse.com/api
NEXT_PUBLIC_API_URL=https://api.jurinapse.com
```

## 🧪 Tests de Validation

### Après propagation DNS :
```bash
# 1. Tester résolution DNS
nslookup jurinapse.com
nslookup api.jurinapse.com

# 2. Tester HTTPS
curl -I https://jurinapse.com
curl -I https://api.jurinapse.com

# 3. Tester API
curl https://api.jurinapse.com/api/test
```

## 📊 Monitoring Cloudflare

### Analytics à surveiller :
- **Requests** : Trafic total
- **Bandwidth** : Données transférées  
- **Threats** : Attaques bloquées
- **Cache** : Taux de mise en cache

### Notifications :
1. **Notifications** → **Settings**
2. **Activer** :
   - DDoS alerts
   - High error rate
   - SSL certificate issues

## 🎯 Résultat Final

Une fois configuré, vous aurez :
- **https://jurinapse.com** → Frontend Vercel
- **https://api.jurinapse.com** → Backend Railway
- **Protection DDoS** automatique
- **SSL gratuit** auto-renouvelé
- **Performance** améliorée (CDN)

---

**⏱️ Temps total** : 30 minutes configuration + 2-6h propagation
**🛡️ Protection** : Immédiate dès activation
**💰 Coût** : 0€ (plan gratuit Cloudflare)
