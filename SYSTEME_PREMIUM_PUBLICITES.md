# 👑 Système Premium - Masquage des Publicités

## 📝 Vue d'Ensemble

Le système premium permet aux utilisateurs ayant le statut premium de **ne plus voir aucune publicité** sur JuriNapse. Les publicités sont automatiquement masquées en temps réel selon le statut de l'utilisateur.

## 🎯 Fonctionnalités

### ✅ Masquage Automatique
- **Utilisateurs Premium** : Aucune publicité affichée
- **Utilisateurs Standard** : Toutes les publicités visibles
- **Vérification en temps réel** : Basée sur le rôle `premium` de l'utilisateur connecté

### ✅ Protection Complète
Tous les composants publicitaires sont protégés :
- `RandomInstanceAd` (nouveau système aléatoire)
- `BrandConsistentAd` (alias du nouveau système)
- `RandomAdBanner` (ancien système)
- `PrestigePhotoOnlyAd` et `AIWebOnlyAd`
- `AdBanner` (Google AdSense)
- `MediumRectangle` et `HalfPage` (formats prédéfinis)

## 🔧 Implémentation Technique

### Hook `usePremiumStatus`

```tsx
// hooks/usePremiumStatus.ts
import { useAuth } from '../contexts/AuthContext';
import { hasRole } from '../utils/roles';

export const usePremiumStatus = () => {
  const { user } = useAuth();
  
  return {
    isPremium: user ? hasRole(user, 'premium') : false,
    user
  };
};
```

### Protection des Composants Publicitaires

```tsx
// Exemple dans RandomInstanceAd
export const RandomInstanceAd: React.FC<RandomInstanceAdProps> = ({
  width, height, className
}) => {
  // Vérifier si l'utilisateur est premium
  const { isPremium } = usePremiumStatus();
  
  // Si l'utilisateur est premium, ne pas afficher de publicité
  if (isPremium) {
    return null;
  }

  // Logique publicitaire normale...
  const selectedBrand = useRandomBrand();
  const selectedAd = useAdByBrand(selectedBrand, width, height);
  
  return <CustomAdBanner {...selectedAd} />;
};
```

## 🚀 Composants Protégés

### Composants Principaux

```tsx
// Nouveau système aléatoire par instance
<RandomInstanceAd width={300} height={250} />

// Alias pour compatibilité
<BrandConsistentAd width={300} height={600} />

// Ancien système aléatoire
<RandomAdBanner width={300} height={250} />

// Composants spécifiques
<PrestigePhotoOnlyAd width={300} height={250} />
<AIWebOnlyAd width={300} height={600} />

// Google AdSense
<AdBanner slot="banner" size={[728, 90]} />
```

### Formats Prédéfinis

```tsx
// Formats déjà intégrés dans les pages
<MediumRectangle className="mx-auto" />     // 300x250
<HalfPage className="sticky top-4" />       // 300x600
<Leaderboard className="w-full" />          // 728x90 (Google Ads)
```

## 🔄 Comportement par Statut

### Utilisateur Standard (Non Premium)
```
✅ Toutes les publicités affichées
✅ Rotation aléatoire Prestige Photo / AIAWEB
✅ Google AdSense fonctionnel
✅ Emplacements publicitaires visibles
```

### Utilisateur Premium
```
🚫 Aucune publicité affichée
🚫 Composants publicitaires retournent `null`
🚫 Emplacements masqués automatiquement
✅ Expérience sans publicité
```

## 📊 Vérification du Statut Premium

### Backend - Modèle User
```js
// models/user.model.js
userSchema.methods.isPremium = function() {
  // Vérifier si l'utilisateur a le rôle premium
  if (!this.hasRole('premium')) return false;
  
  // Vérifier l'expiration si définie
  if (this.premiumExpiresAt && this.premiumExpiresAt <= new Date()) {
    this.removeRole('premium');
    return false;
  }
  
  return true;
};
```

### Frontend - Utilitaire Rôles
```tsx
// utils/roles.ts
export const hasRole = (user: UserWithRoles | undefined, role: UserRole): boolean => {
  if (!user || !user.role) return false;
  const userRoles = parseRoles(user.role);
  return userRoles.includes(role);
};
```

## 🧪 Tests et Validation

### Page de Test : `TestPremiumAds.tsx`

- Affiche le statut premium de l'utilisateur connecté
- Montre/cache les publicités selon le statut
- Instructions de test complètes
- Démonstration en temps réel

### Commandes de Test

```bash
# Compiler et vérifier
npm run build

# Test de développement
npm run dev
# → Naviguer vers /test-premium-ads
```

### Scénarios de Test

1. **Connexion Standard** → Publicités visibles
2. **Attribution Premium** → Publicités disparaissent
3. **Révocation Premium** → Publicités réapparaissent
4. **Rechargement Page** → Statut maintenu
5. **Expiration Premium** → Retour automatique aux publicités

## 🔗 Intégration dans les Pages

### Pages Principales Protégées

```tsx
// FeedPage.tsx
<RandomInstanceAd width={300} height={250} className="mx-auto" />

// PostDetailPage.tsx  
<RandomInstanceAd width={300} height={600} className="sticky top-4" />

// UserProfilePage.tsx
<RandomInstanceAd width={300} height={250} />
```

### Formats dans AdFormats.tsx

```tsx
// AdFormats.tsx - Automatiquement protégés
export const MediumRectangle = () => (
  <BrandConsistentAd width={300} height={250} />
);

export const HalfPage = () => (
  <BrandConsistentAd width={300} height={600} />  
);
```

## 💡 Avantages

### Pour les Utilisateurs Premium
- **Expérience pure** : Navigation sans interruption publicitaire
- **Performance** : Pas de chargement de ressources publicitaires
- **Valeur ajoutée** : Bénéfice tangible du statut premium

### Pour l'Application
- **Monétisation** : Incitation à souscrire au premium
- **Flexibilité** : Contrôle granulaire par utilisateur
- **Maintenance** : Système centralisé et réutilisable

## 🔧 Maintenance

### Ajouter Protection à un Nouveau Composant

```tsx
import { usePremiumStatus } from '../../hooks/usePremiumStatus';

const NewAdComponent: React.FC = () => {
  const { isPremium } = usePremiumStatus();
  
  if (isPremium) {
    return null; // Masquer pour les utilisateurs premium
  }
  
  // Logique publicitaire...
};
```

### Débogage

```tsx
// Ajouter logs temporaires
const { isPremium, user } = usePremiumStatus();
console.log('Premium status:', { isPremium, userId: user?.id, roles: user?.role });
```

## 📦 Structure des Fichiers

```
frontend/src/
├── hooks/
│   └── usePremiumStatus.ts          # Hook de vérification premium
├── components/Ads/
│   ├── BrandConsistentAd.tsx        # Système aléatoire protégé
│   ├── RandomAdBanner.tsx           # Ancien système protégé  
│   ├── AdBanner.tsx                 # Google Ads protégé
│   └── AdFormats.tsx                # Formats prédéfinis protégés
├── examples/
│   └── TestPremiumAds.tsx           # Page de test du système
└── utils/
    └── roles.ts                     # Utilitaires de rôles
```

## 🚀 Déploiement

1. **Hook Premium** ✅ - `usePremiumStatus.ts` créé
2. **Protection Composants** ✅ - Tous les composants pub protégés
3. **Tests Fonctionnels** ✅ - Page de test complète
4. **Documentation** ✅ - Guide complet
5. **Compilation** ✅ - Aucune erreur
6. **Prêt Production** ✅

Le système est **entièrement fonctionnel** et **prêt pour la production** ! 🎉