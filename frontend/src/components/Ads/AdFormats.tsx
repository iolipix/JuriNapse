import React from 'react';
import AdBanner from './AdBanner';
import { PrestigePhotoMedium, PrestigePhotoHalf } from './PrestigePhotoAds';

// Composants prédéfinis pour différents formats publicitaires

// Format rectangulaire standard (fil d'actualité) - Prestige Photo
export const MediumRectangle: React.FC<{ className?: string }> = ({ className }) => (
  <PrestigePhotoMedium className={className} />
);

// Bannière horizontale (en haut/bas de page)
export const Leaderboard: React.FC<{ className?: string }> = ({ className }) => (
  <AdBanner 
    slot="leaderboard"
    size={[728, 90]}
    format="banner"
    testMode={true}
    className={className}
  />
);

// Bannière mobile
export const MobileBanner: React.FC<{ className?: string }> = ({ className }) => (
  <AdBanner 
    slot="mobile-banner"
    size={[320, 50]}
    format="banner"
    className={className}
  />
);

// Gratte-ciel pour sidebar (vertical)
export const WideSkyscraper: React.FC<{ className?: string }> = ({ className }) => (
  <AdBanner 
    slot="wide-skyscraper"
    size={[160, 600]}
    format="banner"
    className={className}
    responsive={false}
  />
);

// Demi-page pour sidebar - Prestige Photo
export const HalfPage: React.FC<{ className?: string }> = ({ className }) => (
  <PrestigePhotoHalf className={className} />
);

// Grand rectangle
export const LargeRectangle: React.FC<{ className?: string }> = ({ className }) => (
  <AdBanner 
    slot="large-rectangle"
    size={[336, 280]}
    format="rectangle"
    className={className}
  />
);

// Carré
export const Square: React.FC<{ className?: string }> = ({ className }) => (
  <AdBanner 
    slot="square"
    size={[250, 250]}
    format="rectangle"
    className={className}
  />
);

// Grande bannière (Top Leaderboard)
export const SuperLeaderboard: React.FC<{ className?: string }> = ({ className }) => (
  <AdBanner 
    slot="super-leaderboard"
    size={[970, 90]}
    format="banner"
    className={className}
  />
);

// Grand carré (Large Square)
export const LargeSquare: React.FC<{ className?: string }> = ({ className }) => (
  <AdBanner 
    slot="large-square"
    size={[300, 300]}
    format="rectangle"
    className={className}
  />
);

// Portrait (format vertical plus large)
export const Portrait: React.FC<{ className?: string }> = ({ className }) => (
  <AdBanner 
    slot="portrait"
    size={[300, 1050]}
    format="rectangle"
    className={className}
    responsive={false}
  />
);
