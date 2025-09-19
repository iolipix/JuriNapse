# 🎲 Système de Publicités Aléatoires par Instance

## 📝 Vue d'Ensemble

Le nouveau système de publicités génère **chaque publicité de manière aléatoire et indépendante** au moment de son chargement, tout en restant **stable une fois affichée**.

## 🎯 Fonctionnalités Principales

### ✅ Génération Aléatoire par Instance
- Chaque composant `RandomInstanceAd` génère sa marque indépendamment
- Probabilité 50/50 entre **Prestige Photo** et **AI Web**
- Les publicités sur une même page peuvent être de marques différentes

### ✅ Stabilité sur la Page
- Une fois la publicité générée, elle reste stable pendant toute la durée de vie du composant
- Pas de changement aléatoire pendant la navigation sur la même page
- Seul un rechargement de page génère de nouvelles publicités

### ✅ Mix de Marques Autorisé
- Sur une même page, on peut avoir :
  - Pub 1: Prestige Photo, Pub 2: AI Web
  - Pub 1: AI Web, Pub 2: Prestige Photo  
  - Pub 1: Prestige Photo, Pub 2: Prestige Photo
  - Pub 1: AI Web, Pub 2: AI Web

## 🔧 Utilisation Technique

### Composant Principal : `RandomInstanceAd`

```tsx
import { RandomInstanceAd } from '../components/Ads';

// Publicité 300x250 (Medium Rectangle)
<RandomInstanceAd width={300} height={250} />

// Publicité 300x600 (Half Page)
<RandomInstanceAd width={300} height={600} />

// Avec className personnalisée
<RandomInstanceAd 
  width={300} 
  height={250} 
  className="my-custom-class" 
/>
```

### Intégration dans les Pages

```tsx
// Dans FeedPage.tsx
<RandomInstanceAd width={300} height={250} className="mx-auto" />

// Dans PostDetailPage.tsx  
<RandomInstanceAd width={300} height={600} className="sticky top-4" />

// Dans UserProfilePage.tsx
<RandomInstanceAd width={300} height={250} />
```

## ⚙️ Implémentation Technique

### Hook `useRandomBrand()`

```tsx
const useRandomBrand = (): AdBrand => {
  const [brand, setBrand] = useState<AdBrand>('prestige-photo');

  useEffect(() => {
    // Génération une seule fois au mount du composant
    const randomBrand = Math.random() < 0.5 ? 'prestige-photo' : 'ai-web';
    setBrand(randomBrand);
  }, []); // Tableau vide = exécution unique

  return brand;
};
```

### Configuration des Publicités

```tsx
// PRESTIGE PHOTO - Toutes les tailles
const PRESTIGE_PHOTO_ADS: AdConfig[] = [
  {
    id: 'prestige-photo-medium',
    imageUrl: '/ads/prestige-photo-300x250.jpg',
    clickUrl: 'https://prestige-photo.fr/',
    width: 300,
    height: 250
  },
  {
    id: 'prestige-photo-half',
    imageUrl: '/ads/prestige-photo-300x600.jpg', 
    clickUrl: 'https://prestige-photo.fr/',
    width: 300,
    height: 600
  }
];

// AI WEB - Toutes les tailles  
const AI_WEB_ADS: AdConfig[] = [
  {
    id: 'ai-web-medium',
    imageUrl: '/ads/ai-web-300x250.jpg',
    clickUrl: 'https://ai-web.fr/',
    width: 300,
    height: 250
  },
  {
    id: 'ai-web-half',
    imageUrl: '/ads/ai-web-300x600.jpg',
    clickUrl: 'https://ai-web.fr/', 
    width: 300,
    height: 600
  }
];
```

## 🎲 Exemples de Résultats

### Page avec 3 Publicités - Possibilités :

```
Résultat A:          Résultat B:          Résultat C:
Pub 1: Prestige     Pub 1: AI Web        Pub 1: Prestige
Pub 2: AI Web       Pub 2: Prestige      Pub 2: Prestige  
Pub 3: Prestige     Pub 3: AI Web        Pub 3: Prestige

Résultat D:          Résultat E:          Résultat F:
Pub 1: AI Web       Pub 1: AI Web        Pub 1: Prestige
Pub 2: AI Web       Pub 2: AI Web        Pub 2: AI Web
Pub 3: AI Web       Pub 3: Prestige      Pub 3: AI Web
```

## 📊 Distribution Statistique

- **Sur une publicité** : 50% Prestige Photo, 50% AI Web
- **Sur une page avec N pubs** : Distribution binomiale
  - 2 pubs : 25% PP/PP, 50% mixte, 25% AW/AW
  - 3 pubs : 12.5% tout PP, 37.5% mixte majoritaire PP, 37.5% mixte majoritaire AW, 12.5% tout AW

## 🔄 Différences avec l'Ancien Système

| Aspect | Ancien Système (Session) | Nouveau Système (Instance) |
|--------|---------------------------|----------------------------|
| **Cohérence** | Une marque par session | Mix possible par page |
| **Persistance** | SessionStorage | État du composant |
| **Rechargement** | Garde la même marque | Nouvelle génération aléatoire |
| **Flexibilité** | Cohérence stricte | Variété sur chaque page |

## 🧪 Tests

### Page de Test : `TestRandomInstanceAds.tsx`

- Affiche 5 publicités simultanément
- Montre le comportement de génération aléatoire
- Documentation du fonctionnement
- Instructions de test pour l'utilisateur

### Commandes de Test

```bash
# Compiler et vérifier
npm run build

# Test de développement
npm run dev
# → Naviguer vers /test-random-ads
```

## 📦 Structure des Fichiers

```
frontend/src/components/Ads/
├── BrandConsistentAd.tsx     # Système aléatoire par instance
├── index.ts                  # Exports mis à jour
└── CustomAdBanner.tsx        # Composant de base

frontend/src/examples/
└── TestRandomInstanceAds.tsx # Page de test du nouveau système
```

## 🚀 Déploiement

1. **Compilation réussie** ✅
2. **Tests fonctionnels** ✅ 
3. **Documentation complète** ✅
4. **Prêt pour production** ✅

## 💡 Avantages du Nouveau Système

1. **Variété** : Chaque page peut avoir un mix de marques
2. **Équilibrage** : Distribution 50/50 à long terme
3. **Stabilité** : Pas de changement pendant la navigation
4. **Simplicité** : Aucune dépendance externe (localStorage, etc.)
5. **Réactivité** : Nouveau contenu à chaque rechargement