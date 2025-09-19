# 🎯 Système de Publicités Aléatoires - AI Web + Prestige Photo

## Vue d'ensemble

Le système de publicités JuriNapse effectue maintenant une **rotation aléatoire** entre :
- 🎯 **Prestige Photo** (services photographiques)
- 🤖 **AI Web** (solutions intelligence artificielle web)
- 📱 **Formats génériques** (post, profil)

## Configuration actuelle

### Publicités disponibles (rotation équitable)

| **Nom** | **Taille** | **URL** | **Probabilité** |
|---------|------------|---------|-----------------|
| Prestige Photo Medium | 300x250 | https://prestige-photo.fr/ | ~16.7% |
| Prestige Photo Half | 300x600 | https://prestige-photo.fr/ | ~16.7% |
| AI Web Medium | 300x250 | https://ai-web.fr/ | ~16.7% |
| AI Web Half | 300x600 | https://ai-web.fr/ | ~16.7% |
| Format Post | 300x250 | # | ~16.7% |
| Format Profil | 300x250 | # | ~16.7% |

## Utilisation

### 🎲 Rotation aléatoire automatique
```tsx
import { RandomAdBanner } from '@/components/Ads';

// Publicité aléatoire 300x250 (toutes marques confondues)
<RandomAdBanner width={300} height={250} />

// Publicité aléatoire 300x600 (toutes marques confondues)
<RandomAdBanner width={300} height={600} />
```

### 🎯 Composants spécifiques (avec rotation interne)
```tsx
import { PrestigePhotoAd, AIWebAd } from '@/components/Ads';

// Utilise la rotation aléatoire mais avec cohérence de marque
<PrestigePhotoAd format="medium" />
<AIWebAd format="half" />
```

### 🔄 Rotation pure
```tsx
import { RandomAd } from '@/components/Ads';

// Rotation complètement aléatoire
<RandomAd format="medium" />
<RandomAd format="any" />
```

## Algorithme de rotation

1. **Sélection aléatoire** : `Math.floor(Math.random() * availableAds.length)`
2. **Filtrage par taille** : Si width/height spécifiés, filtre par dimensions
3. **Exclusion** : Possibilité d'exclure certaines publicités
4. **Fallback** : Si aucune pub ne correspond, utilise toute la liste

## Fichiers techniques

```
frontend/
├── src/components/Ads/
│   ├── RandomAdBanner.tsx     # 🎲 Système principal de rotation
│   ├── PrestigePhotoAds.tsx   # 🎯 Composants Prestige Photo
│   ├── AIWebAds.tsx           # 🤖 Composants AI Web
│   └── index.ts               # Exports principaux
└── public/ads/
    ├── prestige-photo-300x250.jpg  # Image Prestige Photo rect.
    ├── prestige-photo-300x600.jpg  # Image Prestige Photo vert.
    ├── ai-web-300x250.jpg          # Image AI Web rect.
    ├── ai-web-300x600.jpg          # Image AI Web vert.
    ├── format-post.png             # Format générique post
    └── format-profil.png           # Format générique profil
```

## Configuration avancée

### Exclure certaines publicités
```tsx
<RandomAdBanner 
  width={300} 
  height={250} 
  excludeIds={['format-post', 'format-profil']} 
/>
// ➜ Affichera seulement Prestige Photo et AI Web
```

### Forcer une taille spécifique
```tsx
<RandomAdBanner 
  width={300} 
  height={600} 
/>
// ➜ Affichera seulement les publicités 300x600 (Prestige Photo Half + AI Web Half)
```

## Statistiques de répartition

Avec 6 publicités total :
- **Prestige Photo** : 33.3% (2/6)
- **AI Web** : 33.3% (2/6)
- **Formats génériques** : 33.3% (2/6)

## Prochaines étapes

1. ✅ **Images AI Web** : Remplacer les placeholders par de vraies images
2. ✅ **URLs** : Configurer l'URL finale d'AI Web
3. 🔄 **Tracking** : Ajouter des stats de clics par publicité
4. 📊 **Analytics** : Mesurer l'efficacité de chaque rotation

## Exemple d'intégration

```tsx
// Dans FeedPage.tsx
import { RandomAdBanner } from '@/components/Ads';

// Publicité aléatoire dans le feed
<RandomAdBanner width={300} height={250} className="my-4" />

// Dans ProfilePage.tsx
import { AIWebAd, PrestigePhotoAd } from '@/components/Ads';

// Rotation entre AI Web et Prestige Photo
{Math.random() > 0.5 ? 
  <AIWebAd format="half" /> : 
  <PrestigePhotoAd format="half" />
}
```