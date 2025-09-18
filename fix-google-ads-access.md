# 🚨 Fix Google Ads - Site "Introuvable"

## Problème identifié
Google AdSense affiche "Introuvable" pour jurinapse.com, ce qui signifie que Google ne peut pas accéder au site.

## Valeurs à vérifier/fournir à Google

### 1. 🌐 URL du site
- **Valeur actuelle** : `jurinapse.com`
- **Valeur correcte** : `https://jurinapse.com` ou `https://www.jurinapse.com`
- **Action** : Vérifier quelle URL fonctionne réellement

### 2. 📄 Fichier ads.txt (OBLIGATOIRE)
- **Emplacement** : `https://jurinapse.com/ads.txt`
- **Contenu requis** :
```
google.com, pub-1676150794227736, DIRECT, f08c47fec0942fa0
```

### 3. 🔧 Configuration DNS/Domaine
- Vérifier que le domaine pointe vers Railway
- S'assurer que HTTPS fonctionne
- Vérifier les redirections

### 4. 🤖 Fichier robots.txt
- **Emplacement** : `https://jurinapse.com/robots.txt`
- **Contenu** : Ne doit PAS bloquer Googlebot

### 5. 📊 Google Search Console
- Ajouter et vérifier la propriété du site
- Soumettre le sitemap
- Vérifier l'indexation

## Actions immédiates

### Étape 1 : Créer le fichier ads.txt
```bash
# Dans Railway, créer le fichier public/ads.txt
echo "google.com, pub-1676150794227736, DIRECT, f08c47fec0942fa0" > frontend/public/ads.txt
```

### Étape 2 : Vérifier l'accessibilité
Tester ces URLs :
- https://jurinapse.com
- https://www.jurinapse.com  
- https://jurinapse.com/ads.txt
- https://jurinapse.com/robots.txt

### Étape 3 : Dans Google AdSense
1. Aller dans "Sites"
2. Cliquer sur "Modifier" pour jurinapse.com
3. Essayer ces variations d'URL :
   - `https://jurinapse.com`
   - `https://www.jurinapse.com`
   - `jurinapse.com`

### Étape 4 : Vérification Railway
- S'assurer que le domaine custom est bien configuré
- Vérifier les certificats SSL
- Tester la résolution DNS

## Informations pour Google AdSense

### Publisher ID (déjà configuré)
```
ca-pub-1676150794227736
```

### Google Ads Conversion ID (déjà configuré)
```
AW-16780168506
```

### URL à déclarer dans AdSense
```
https://jurinapse.com
```

## Next Steps

1. 🏗️ Créer le fichier ads.txt
2. 🔍 Vérifier l'accessibilité du site
3. 📝 Mettre à jour l'URL dans Google AdSense
4. ⏰ Attendre 24-48h pour la re-vérification
5. 📊 Ajouter à Google Search Console si pas déjà fait

## Diagnostic automatique

Exécuter ces commandes pour diagnostiquer :

```bash
# Tester l'accessibilité
curl -I https://jurinapse.com

# Vérifier le fichier ads.txt
curl https://jurinapse.com/ads.txt

# Vérifier robots.txt
curl https://jurinapse.com/robots.txt
```