# 🔍 Vérification Configuration DNS - jurinapse.com

## 📋 Étapes chez OVH

### 1. Connexion
- URL : https://www.ovh.com/manager/
- Identifiants : Votre NIC-handle OVH

### 2. Navigation
```
Espace Client > Noms de domaine > jurinapse.com > Zone DNS
```

### 3. Modification serveurs DNS
- **Bouton** : "Modifier les serveurs DNS"
- **Action** : Remplacer par les nameservers Cloudflare

### 4. Configuration finale
```
Serveur DNS 1 : ana.ns.cloudflare.com
Serveur DNS 2 : rick.ns.cloudflare.com
```

## 🧪 Vérifications Avant/Après

### AVANT modification (serveurs OVH actuels) :
```bash
# Dans votre terminal :
nslookup -type=NS jurinapse.com
```

### APRÈS modification (serveurs Cloudflare) :
```bash
# Attendre 2-6h puis vérifier :
nslookup -type=NS jurinapse.com
# Doit afficher les serveurs Cloudflare
```

## ⏱️ Délai de propagation
- **Minimum** : 2 heures
- **Maximum** : 48 heures  
- **Généralement** : 4-6 heures

## 🚨 Points d'attention OVH

### Si vous avez des emails @jurinapse.com :
⚠️ **IMPORTANT** : La modification va temporairement couper les emails !

**Solution** :
1. Noter vos paramètres MX actuels AVANT de changer
2. Les reconfigurer dans Cloudflare après
3. Ou garder les emails chez OVH (configuration mixte)

### Configuration email mixte (Recommandé) :
```dns
# Dans Cloudflare après propagation :
Type  Name  Content                 Proxy
MX    @     mx1.mail.ovh.net        ❌ DNS Only
MX    @     mx2.mail.ovh.net        ❌ DNS Only
MX    @     mx3.mail.ovh.net        ❌ DNS Only
```

## 🎯 Checklist Actions

### ✅ À faire MAINTENANT chez OVH :
- [ ] Se connecter à l'espace client
- [ ] Aller sur jurinapse.com > Zone DNS
- [ ] Noter les serveurs MX actuels (emails)
- [ ] Changer les serveurs DNS vers Cloudflare
- [ ] Confirmer la modification

### ✅ À faire APRÈS propagation (4-6h) :
- [ ] Vérifier que jurinapse.com pointe vers Cloudflare
- [ ] Configurer les emails dans Cloudflare si nécessaire
- [ ] Tester https://jurinapse.com

## 🔧 Script de Vérification

### Vérifier l'état actuel :
```bash
# Serveurs DNS actuels
nslookup -type=NS jurinapse.com

# Emails (MX records)
nslookup -type=MX jurinapse.com

# IP actuelle
nslookup jurinapse.com
```

## 📞 Support si Problème

### OVH Support :
- **Téléphone** : 1007 (gratuit depuis la France)
- **Chat** : Dans l'espace client
- **Ticket** : Section "Assistance"

### Questions fréquentes :
- **"Où sont les serveurs DNS ?"** → Zone DNS ou Serveurs DNS
- **"Ça ne marche pas ?"** → Attendre 4-6h minimum
- **"Mes emails ne marchent plus ?"** → Configurer MX dans Cloudflare

---

## 🎉 Une fois fait chez OVH

Quand vous aurez changé les nameservers :
1. **Patience** : Attendre 2-6h pour propagation
2. **Vérification** : Je vous aiderai à tester
3. **Configuration finale** : Sécurité + Performance Cloudflare

**Dites-moi quand c'est fait chez OVH, et on continue ! 🚀**
