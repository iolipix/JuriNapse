import React from 'react';
import AdBanner from './AdBanner';

// Composants prédéfinis pour différents formats publicitaires

// Format rectangulaire standard (fil d'actualité)
export const MediumRectangle: React.FC<{ className?: string }> = ({ className }) => (
  <AdBanner 
    slot="medium-rectangle"
    size={[300, 250]}
    format="rectangle"
    testMode={true}
    className={className}
  />
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

// Demi-page pour sidebar
export const HalfPage: React.FC<{ className?: string }> = ({ className }) => (
  <AdBanner 
    slot="half-page"
    size={[300, 600]}
    format="rectangle"
    className={className}
    responsive={false}
  />
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
