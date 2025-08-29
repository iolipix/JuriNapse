# Système Publicitaire Google Ads - JuriNapse

## Vue d'ensemble

Le système publicitaire intégré permet d'afficher des publicités Google Ads de manière native dans l'application avec un mode test pour éviter les violations des politiques Google.

## Architecture

### Composants principaux

1. **AdProvider** - Fournisseur de contexte React pour la gestion des publicités
2. **AdBanner** - Composant pour bannières publicitaires rectangulaires
3. **AdFeedNative** - Publicités natives intégrées dans le feed
4. **AdSidebar** - Sidebar publicitaire pour profils et posts
5. **AdComponents** - Composants utilitaires et hooks

### Intégration

Les publicités sont intégrées dans :
- **FeedPage** : Publicités natives dans le feed + sidebar
- **ProfilePage** : Sidebar publicitaire spécialisée profil
- **PostDetailPage** : Sidebar publicitaire spécialisée post

## Configuration

### Variables d'environnement

Ajoutez ces variables à votre fichier `.env` :

```bash
# Configuration Google Ads
VITE_GOOGLE_ADS_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX
VITE_GOOGLE_ADS_TEST_MODE=true
VITE_GOOGLE_ADS_ENABLED=true
```

### Mode Test (Recommandé)

**IMPORTANT** : Utilisez le mode test pour éviter les violations des politiques Google Ads.

- `VITE_GOOGLE_ADS_TEST_MODE=true` : Affiche des placeholders de test
- `VITE_GOOGLE_ADS_TEST_MODE=false` : Charge les vraies publicités Google

### Types de publicités

1. **Bannières sidebar** : 300×250px rectangulaires
2. **Publicités natives feed** : S'adaptent au design des posts
3. **Bannières responsive** : S'adaptent à la taille d'écran

## Utilisation

### Intégration basique

```tsx
import { AdProvider, AdBanner } from '../components/Ads';

function App() {
  return (
    <AdProvider>
      <div className="grid grid-cols-4 gap-6">
        <div className="col-span-3">
          {/* Contenu principal */}
        </div>
        <div className="col-span-1">
          <AdBanner 
            slot="your-ad-slot-id"
            size={[300, 250]}
            format="rectangle"
          />
        </div>
      </div>
    </AdProvider>
  );
}
```

### Publicités dans le feed

```tsx
import { usePostsWithAds, AdFeedNative } from '../components/Ads';

function Feed({ posts }) {
  const postsWithAds = usePostsWithAds(posts, 4); // Une pub tous les 4 posts
  
  return (
    <div>
      {postsWithAds.map((item, index) => {
        if ('isAd' in item && item.isAd) {
          return (
            <AdFeedNative
              key={item.id}
              slot={`feed-${item.adIndex}`}
              index={item.adIndex}
            />
          );
        }
        return <PostCard key={item.id} post={item} />;
      })}
    </div>
  );
}
```

## Sécurité et Conformité

### Mode Test

Le mode test affiche des placeholders avec :
- Texte "🎯 Publicité Test"
- Informations de slot et taille
- Bordures en pointillés
- Aucune requête vers Google

### Lazy Loading

Les publicités sont chargées uniquement quand elles entrent dans le viewport pour :
- Améliorer les performances
- Réduire la consommation de données
- Respecter les bonnes pratiques UX

### Gestion d'erreur

- Fallbacks automatiques en cas d'erreur de chargement
- Messages d'erreur discrets
- Mode dégradé sans publicités

## Déploiement

### Étapes de déploiement

1. **Mode Test** (Développement)
   ```bash
   VITE_GOOGLE_ADS_TEST_MODE=true
   ```

2. **Validation** (Pré-production)
   - Tester l'intégration avec de vraies pubs en mode limité
   - Vérifier le respect des politiques Google

3. **Production** (Live)
   ```bash
   VITE_GOOGLE_ADS_TEST_MODE=false
   VITE_GOOGLE_ADS_CLIENT_ID=ca-pub-votre-vraie-id
   ```

### Configuration Google AdSense

1. Créer un compte Google AdSense
2. Ajouter votre domaine
3. Obtenir votre ID client (`ca-pub-xxxxx`)
4. Créer des unités publicitaires
5. Noter les IDs de slot pour chaque emplacement

### Unités publicitaires recommandées

- **Sidebar Profile** : Rectangle 300×250
- **Sidebar Post** : Rectangle 300×250  
- **Feed Native** : Responsive
- **Mobile Banner** : 320×50 (optionnel)

## Monitoring

### Métriques à surveiller

- Taux d'impression (viewable impressions)
- CTR (Click Through Rate)
- RPM (Revenue Per Mille)
- Temps de chargement des publicités
- Erreurs de chargement

### Outils recommandés

- Google AdSense Dashboard
- Google Analytics Enhanced Ecommerce
- Core Web Vitals
- Performance monitoring

## Optimisation

### Bonnes pratiques

1. **Placement stratégique** : Intégrer naturellement dans le contenu
2. **Responsive design** : S'adapter à tous les écrans
3. **Loading lazy** : Charger uniquement quand nécessaire
4. **A/B Testing** : Tester différents emplacements
5. **Performance** : Minimiser l'impact sur les Core Web Vitals

### Réglages par défaut

- Publicité feed : tous les 4 posts
- Sidebar : sticky positioning
- Mobile : masquer la sidebar, garder les natives
- Refresh : automatique selon les règles Google

## Dépannage

### Problèmes courants

**Publicités ne s'affichent pas**
- Vérifier `VITE_GOOGLE_ADS_ENABLED=true`
- Contrôler l'ID client dans les variables d'environnement
- Regarder la console pour les erreurs

**Mode test ne fonctionne pas**
- Confirmer `VITE_GOOGLE_ADS_TEST_MODE=true`
- Vider le cache du navigateur
- Redémarrer le serveur de développement

**Erreurs de politique Google**
- Utiliser le mode test pendant le développement
- Vérifier le contenu pour la conformité
- Respecter les guidelines Google AdSense

## Support

Pour toute question concernant l'intégration publicitaire :
1. Vérifier cette documentation
2. Consulter les logs de la console
3. Tester en mode debug avec `VITE_GOOGLE_ADS_DEBUG=true`
