# Configuration des Publicités JuriNapse

## 🆕 Nouvelles Publicités Ajoutées

Deux nouvelles publicités ont été ajoutées au système de rotation aléatoire :

### 1. Format Post (`format-post.png`)
- **Fichier** : `/ads/format-post.png`
- **Dimensions** : 300x250px
- **URL de destination** : À configurer (actuellement '#')
- **Description** : Publicité au format post

### 2. Format Profil (`format-profil.png`)
- **Fichier** : `/ads/format-profil.png`
- **Dimensions** : 300x250px
- **URL de destination** : À configurer (actuellement '#')
- **Description** : Publicité au format profil

## ⚙️ Configuration des URLs

Pour configurer les URLs de destination des nouvelles publicités, modifiez le fichier :
`frontend/src/components/Ads/RandomAdBanner.tsx`

Remplacez les `clickUrl: '#'` par les vraies URLs :

```tsx
// Ligne ~25 pour Format post
clickUrl: 'https://votre-url-de-destination.com',

// Ligne ~35 pour Format profil  
clickUrl: 'https://votre-autre-url-de-destination.com',
```

## 🎲 Système de Rotation Aléatoire

Le nouveau système choisit aléatoirement parmi toutes les publicités disponibles :
- ✅ Prestige Photo (300x250)
- ✅ Prestige Photo (300x600) 
- ✅ Format Post (300x250)
- ✅ Format Profil (300x250)

### 📊 Statistiques de Répartition

Test sur 1000 tirages aléatoires :
- `prestige-photo-medium`: ~26%
- `prestige-photo-half`: ~26%
- `format-post`: ~24%
- `format-profil`: ~24%

La répartition est équitable entre toutes les publicités.

### 🎯 Utilisation

Les publicités s'affichent automatiquement de manière aléatoire dans :
- Les sidebars des profils
- Les sidebars des posts
- Le feed (publicités natives)

#### Exemples d'utilisation :

```tsx
import { RandomAdBanner, RandomAd } from '../components/Ads';

// Publicité aléatoire basique
<RandomAdBanner className="mx-auto" />

// Publicité avec taille spécifique
<RandomAdBanner width={300} height={250} />

// Publicité avec format prédéfini
<RandomAd format="medium" />
```

### 🧪 Test

Pour tester la rotation aléatoire :
1. Assurez-vous que `VITE_GOOGLE_ADS_TEST_MODE=true` dans votre `.env`
2. Démarrez le serveur de développement
3. Rechargez la page plusieurs fois pour voir les différentes publicités
4. Les publicités changent à chaque rendu du composant

**Script de test disponible** : `test-random-ads.js`

## 🔧 Notes Techniques

- ✅ Les composants existants (`PrestigePhotoMedium`, `PrestigePhotoHalf`) utilisent maintenant le système aléatoire
- ✅ La compatibilité avec l'ancien système est maintenue
- ✅ Nouvelles exports disponibles : `RandomAdBanner`, `RandomAd`, `useRandomAd`
- ✅ Aucune erreur de compilation
- ✅ Tests de répartition validés

## 📁 Fichiers Modifiés

1. **Images ajoutées** :
   - `/frontend/public/ads/format-post.png`
   - `/frontend/public/ads/format-profil.png`

2. **Composants créés** :
   - `/frontend/src/components/Ads/RandomAdBanner.tsx`

3. **Composants modifiés** :
   - `/frontend/src/components/Ads/AdBanner.tsx`
   - `/frontend/src/components/Ads/PrestigePhotoAds.tsx`
   - `/frontend/src/components/Ads/index.ts`

4. **Documentation** :
   - `/NOUVELLES_PUBLICITES.md`
   - `/test-random-ads.js`
   - `/frontend/src/examples/ExemplesPublicites.tsx`

## 🚀 Prochaines Étapes

1. **Configurer les URLs** des nouvelles publicités
2. **Tester en développement** avec `npm run dev`
3. **Ajuster la répartition** si nécessaire
4. **Déployer** en production