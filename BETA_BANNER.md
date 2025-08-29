# Bandeau Beta

Le composant `BetaBanner` affiche un bandeau permanent en haut de l'application pour indiquer que le site est en version bêta.

## Utilisation

```tsx
import BetaBanner from './components/Layout/BetaBanner';

// Bandeau par défaut
<BetaBanner />

// Bandeau avec variante animée
<BetaBanner variant="animated" />

// Bandeau minimal
<BetaBanner variant="minimal" />

// Bandeau avec possibilité de le masquer
<BetaBanner dismissible={true} onDismiss={() => console.log('Bandeau masqué')} />
```

## Variantes

### `default`
- Style dégradé bleu/violet/indigo
- Icône d'information
- Message complet sur desktop, réduit sur mobile

### `animated`
- Même style que `default` mais avec des animations
- Icône éclair animée
- Particules en arrière-plan
- Texte avec effet de pulsation

### `minimal`
- Style simple avec fond bleu uni
- Texte centré sans icône
- Version la plus compacte

## Props

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `variant` | `'default' \| 'animated' \| 'minimal'` | `'default'` | Style du bandeau |
| `dismissible` | `boolean` | `false` | Permet de masquer le bandeau |
| `onDismiss` | `() => void` | - | Callback appelé quand le bandeau est masqué |

## Positionnement

Le bandeau est positionné juste en dessous de la navbar. La sidebar et le contenu principal sont automatiquement ajustés :

- Sidebar : `top-28` (7rem) au lieu de `top-16` (4rem)
- Hauteur sidebar : `h-[calc(100vh-7rem)]` au lieu de `h-[calc(100vh-4rem)]`

## Responsive

- Sur desktop : Message complet avec icône
- Sur mobile : Message raccourci pour économiser l'espace

## Personnalisation

Pour modifier le style ou ajouter de nouvelles variantes, éditez le fichier `src/components/Layout/BetaBanner.tsx`.

## Intégration

Le bandeau est intégré dans `App.tsx` et s'affiche sur toutes les pages de l'application.
