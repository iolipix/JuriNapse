# ⚙️ Configuration Variables Vercel pour JuriNapse

## Variables d'environnement à configurer sur vercel.com :

1. Allez sur https://vercel.com/dashboard
2. Sélectionnez votre projet JuriNapse
3. Allez dans Settings > Environment Variables
4. Ajoutez ces variables :

### 🎯 Variables Publicitaires :
```
VITE_GOOGLE_ADS_ENABLED=true
VITE_GOOGLE_ADS_TEST_MODE=false
VITE_GOOGLE_ADS_CLIENT_ID=ca-pub-1676150794227736
```

### 🔧 Variables API :
```
VITE_API_BASE_URL=https://jurinapse-production.up.railway.app/api
```

## 📋 Étapes complètes :

1. **Configurer sur Vercel** :
   - Environment : Production
   - Name : VITE_GOOGLE_ADS_TEST_MODE
   - Value : false

2. **Redéployer** :
   - Après configuration, faire un redéploiement
   - Ou faire un push git pour déclencher le build

3. **Vérifier** :
   - Les publicités "🎯 Test" devraient disparaître
   - Les vraies pubs Google Ads devraient apparaître (si approuvées)

## 🎯 Note importante :
Si Google AdSense n'a pas encore approuvé votre site, 
les espaces publicitaires resteront vides même avec la bonne configuration.
