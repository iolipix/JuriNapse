# Système de Consentement RGPD - Documentation

## Vue d'ensemble

Ce système implémente une solution complète de gestion des cookies et du consentement RGPD pour l'application Lexilis. Il respecte les exigences du RGPD européen et offre une expérience utilisateur transparente.

## Architecture

### Composants Principaux

1. **CookieConsent** (`components/Common/CookieConsent.tsx`)
   - Bannière de consentement avec 2 modes : simple et détaillé
   - Gestion des 4 catégories de cookies
   - Interface responsive avec Tailwind CSS
   - Sauvegarde automatique dans localStorage

2. **CookieProvider** (`hooks/useCookieConsent.tsx`)
   - Context React pour la gestion centralisée des états
   - Hooks utilitaires pour analytics et marketing
   - Persistance avec versioning
   - Hooks conditionnels pour le tracking

3. **CookieSettings** (`components/Settings/CookieSettings.tsx`)
   - Page de gestion des préférences dans les paramètres
   - Interface détaillée avec descriptions complètes
   - Actions de sauvegarde et réinitialisation
   - Liens vers la politique de confidentialité

4. **PrivacyPolicy** (`components/Legal/PrivacyPolicy.tsx`)
   - Page complète de politique de confidentialité
   - Conforme aux exigences RGPD
   - Tableau détaillé des cookies
   - Informations de contact DPO

## Catégories de Cookies

### 1. Cookies Nécessaires ✅ (Toujours actifs)
- **Finalité** : Fonctionnement essentiel du site
- **Exemples** : Session d'authentification, sécurité CSRF, préférences de langue
- **Base légale** : Intérêt légitime
- **Durée** : Session ou 1 an maximum

### 2. Cookies Analytiques 📊 (Consentement requis)
- **Finalité** : Statistiques d'usage anonymisées
- **Exemples** : Google Analytics, temps de session, pages visitées
- **Base légale** : Consentement utilisateur
- **Durée** : 2 ans maximum

### 3. Cookies Marketing 📢 (Consentement requis)
- **Finalité** : Publicité personnalisée et remarketing
- **Exemples** : Pixels de conversion, publicités ciblées
- **Base légale** : Consentement utilisateur
- **Durée** : 1 an maximum

### 4. Cookies Fonctionnels ⚙️ (Consentement requis)
- **Finalité** : Amélioration de l'expérience utilisateur
- **Exemples** : Préférences d'affichage, favoris, personnalisation UI
- **Base légale** : Consentement utilisateur
- **Durée** : 6 mois maximum

## Utilisation

### Intégration de Base

```tsx
import { CookieProvider } from './hooks/useCookieConsent';
import CookieConsent from './components/Common/CookieConsent';

function App() {
  return (
    <CookieProvider>
      <YourApp />
      <CookieConsent />
    </CookieProvider>
  );
}
```

### Tracking Conditionnel

```tsx
import { useAnalytics, useMarketing } from './hooks/useCookieConsent';

const MyComponent = () => {
  const { trackEvent, trackPageView, canUseAnalytics } = useAnalytics();
  const { trackConversion, canUseMarketing } = useMarketing();

  useEffect(() => {
    // Tracking automatiquement conditionné par le consentement
    trackPageView('/my-page');
  }, []);

  const handleClick = () => {
    trackEvent('button_click', { button: 'header_cta' });
  };
};
```

### Gestion des Préférences

```tsx
import { useCookieConsent } from './hooks/useCookieConsent';

const SettingsComponent = () => {
  const { 
    preferences, 
    hasConsent, 
    updatePreferences, 
    clearConsent 
  } = useCookieConsent();

  const handleUpdatePreferences = (newPrefs) => {
    updatePreferences(newPrefs);
  };
};
```

## Structure des Données

### Format de Stockage localStorage

```json
{
  "preferences": {
    "necessary": true,
    "analytics": false,
    "marketing": true,
    "functional": false
  },
  "timestamp": "2025-08-21T10:30:00.000Z",
  "version": "1.0"
}
```

### Interface CookiePreferences

```typescript
interface CookiePreferences {
  necessary: boolean;    // Toujours true
  analytics: boolean;    // Configurable par l'utilisateur
  marketing: boolean;    // Configurable par l'utilisateur
  functional: boolean;   // Configurable par l'utilisateur
}
```

## Conformité RGPD

### ✅ Exigences Respectées

1. **Consentement libre et éclairé**
   - Bannière claire avec options détaillées
   - Pas de cookies non-essentiels sans consentement
   - Explications complètes des finalités

2. **Granularité**
   - Consentement par catégorie de cookies
   - Possibilité d'accepter/refuser individuellement
   - Cookies nécessaires clairement identifiés

3. **Révocabilité**
   - Interface de gestion dans les paramètres
   - Possibilité de modifier à tout moment
   - Suppression complète possible

4. **Transparence**
   - Politique de confidentialité détaillée
   - Tableau des cookies avec durées et finalités
   - Contact DPO disponible

5. **Droits utilisateurs**
   - Accès aux données
   - Rectification
   - Effacement
   - Portabilité
   - Opposition

### 🔧 Fonctionnalités Techniques

- **Versionning** : Système de versions pour les mises à jour
- **Persistance** : localStorage avec fallback graceful
- **Performance** : Chargement conditionnel des scripts
- **Accessibilité** : Interface clavier-friendly
- **Responsive** : Adaptation mobile/desktop

## Navigation et URLs

Le système ajoute automatiquement des URLs pour :

- `/politique-confidentialite` - Politique de confidentialité
- `/conditions-utilisation` - Conditions d'utilisation existantes
- `/parametres/cookies` - Gestion des cookies

## Maintenance

### Mise à jour de la Version

Pour forcer un nouveau consentement après des changements :

```typescript
// Dans useCookieConsent.tsx, changer la version
version: '1.1' // Au lieu de '1.0'
```

### Ajout de Nouvelles Catégories

1. Modifier l'interface `CookiePreferences`
2. Ajouter dans le composant `CookieConsent`
3. Mettre à jour `CookieSettings`
4. Documenter dans `PrivacyPolicy`

### Intégration Analytics

Exemple d'intégration Google Analytics 4 :

```typescript
const trackPageView = (page: string) => {
  if (!canUseAnalytics) return;
  
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('config', 'GA_MEASUREMENT_ID', {
      page_path: page
    });
  }
};
```

## Tests

### Tests de Conformité

- [ ] Bannière s'affiche aux nouveaux utilisateurs
- [ ] Pas de cookies non-essentiels sans consentement
- [ ] Préférences sauvegardées correctement
- [ ] Interface de révocation fonctionnelle
- [ ] Liens vers politique de confidentialité
- [ ] Contact DPO accessible

### Tests Techniques

- [ ] Tracking conditionnel fonctionne
- [ ] localStorage persistant
- [ ] Responsive design
- [ ] Accessibilité clavier
- [ ] Fallback si localStorage désactivé

## Support et Contact

Pour toute question concernant cette implémentation :

- **Développeur** : GitHub Copilot
- **Documentation** : Ce fichier + commentaires dans le code
- **Issues** : Utiliser le système de tickets du projet

---

*Dernière mise à jour : 21 août 2025*
*Version système : 1.0*
