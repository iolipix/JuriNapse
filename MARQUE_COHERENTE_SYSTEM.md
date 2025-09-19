# 🎯 Système de Marque Cohérente - JuriNapse

## Vue d'ensemble

**NOUVEAU** : Le système publicitaire affiche maintenant **UNE SEULE MARQUE par session** avec les bonnes dimensions pour chaque publicité.

## 🔧 Comment ça fonctionne

### 1. **Choix de marque au premier chargement**
- 🎲 **50% de chance** pour Prestige Photo
- 🎲 **50% de chance** pour AI Web
- ✅ **Une fois choisi** = toute la session utilise cette marque

### 2. **Cohérence garantie**
- **Même session** = **même marque** partout
- Toutes les publicités de la page = **même marque**
- Feed, Profils, Posts = **cohérence totale**

### 3. **Dimensions correctes**
- **Prestige Photo** utilise ses propres images (prestige-photo-300x250.jpg, etc.)
- **AI Web** utilise ses propres images (ai-web-300x250.jpg, etc.)
- **Pas de mélange** entre les marques sur une même page

## 📱 Implémentation

### Composant principal
```tsx
import { BrandConsistentAd } from '@/components/Ads';

// Publicité avec marque cohérente (soit Prestige Photo, soit AI Web)
<BrandConsistentAd width={300} height={250} />
```

### Pages mises à jour
- ✅ **FeedPage** : `BrandConsistentAd` 300x250
- ✅ **PostDetailPage** : `BrandConsistentAd` 300x600  
- ✅ **UserProfilePage** : `BrandConsistentAd` 300x250 + 300x600
- ✅ **AdFormats** : `MediumRectangle` et `HalfPage` utilisent `BrandConsistentAd`

## 🎮 Types de publicités

### Marque cohérente (recommandé)
```tsx
<BrandConsistentAd width={300} height={250} />
// ➜ Soit Prestige Photo 300x250, soit AI Web 300x250
```

### Marques forcées (pour tests)
```tsx
<PrestigePhotoOnlyAd width={300} height={250} />
// ➜ Toujours Prestige Photo

<AIWebOnlyAd width={300} height={600} />
// ➜ Toujours AI Web
```

## 📊 Logique de sélection

### Session Storage
```javascript
// Clé utilisée
'jurinapse_ad_brand_session'

// Valeurs possibles
'prestige-photo' | 'ai-web'
```

### Algorithme
1. **Première visite** : Choix aléatoire 50/50
2. **Stockage** : Sauvegarde dans sessionStorage
3. **Pages suivantes** : Réutilise la marque choisie
4. **Nouvelle session** : Nouveau choix aléatoire

## 🔄 Exemples d'utilisation

### Sur une page utilisateur
```tsx
// Toutes ces publicités auront la MÊME marque
<BrandConsistentAd width={300} height={250} />  // Ex: Prestige Photo 300x250
<BrandConsistentAd width={300} height={600} />  // Ex: Prestige Photo 300x600
<BrandConsistentAd width={300} height={250} />  // Ex: Prestige Photo 300x250
```

### Forcer un nouveau choix
```tsx
<BrandConsistentAd 
  width={300} 
  height={250} 
  forceRandomBrand={true}  // Force un nouveau choix aléatoire
/>
```

## 🎯 Mapping des images

### Prestige Photo
| Taille | Fichier | URL |
|--------|---------|-----|
| 300x250 | `/ads/prestige-photo-300x250.jpg` | https://prestige-photo.fr/ |
| 300x600 | `/ads/prestige-photo-300x600.jpg` | https://prestige-photo.fr/ |

### AI Web  
| Taille | Fichier | URL |
|--------|---------|-----|
| 300x250 | `/ads/ai-web-300x250.jpg` | https://ai-web.fr/ |
| 300x600 | `/ads/ai-web-300x600.jpg` | https://ai-web.fr/ |

## 🧪 Test du système

### Scénario 1 : Session Prestige Photo
```
1. Utilisateur arrive sur le site
2. Système choisit "prestige-photo"
3. Feed → Prestige Photo 300x250
4. Profil → Prestige Photo 300x600  
5. Post → Prestige Photo 300x600
➜ Toute la session = Prestige Photo
```

### Scénario 2 : Session AI Web
```
1. Utilisateur arrive sur le site
2. Système choisit "ai-web"
3. Feed → AI Web 300x250
4. Profil → AI Web 300x600
5. Post → AI Web 300x600
➜ Toute la session = AI Web
```

### Scénario 3 : Nouvelle session
```
1. Fermer le navigateur / nouvel onglet
2. Revenir sur le site
3. Nouveau choix aléatoire 50/50
4. Nouvelle marque cohérente pour la session
```

## 📈 Avantages

- ✅ **Plus de confusion** : Une seule marque à la fois
- ✅ **Cohérence visuelle** : Expérience utilisateur homogène  
- ✅ **Bonnes dimensions** : Chaque marque utilise ses images
- ✅ **Équité** : 50/50 sur le long terme
- ✅ **Performance** : Choix unique par session
- ✅ **Flexibilité** : Possibilité de forcer une marque

## 🔧 Fichiers techniques

```
frontend/src/components/Ads/
├── BrandConsistentAd.tsx     # 🎯 Nouveau système principal
├── RandomAdBanner.tsx        # 🔄 Ancien système (gardé pour compatibilité)
└── index.ts                  # Exports mis à jour

frontend/src/examples/
└── TestMarqueCoherente.tsx   # 🧪 Page de test du nouveau système
```

**Résultat** : Les utilisateurs voient maintenant **soit** Prestige Photo **soit** AI Web sur toute leur session, avec les bonnes images pour chaque format ! 🎯