import React from 'react';
import CustomAdBanner from './CustomAdBanner';

// Composants prédéfinis pour les publicités Prestige Photo

// Publicité Prestige Photo format rectangulaire 300x250
export const PrestigePhotoMedium: React.FC<{ className?: string }> = ({ className }) => (
  <CustomAdBanner 
    width={300}
    height={250}
    imageUrl="/ads/prestige-photo-300x250.jpg"
    clickUrl="https://prestige-photo.fr/"
    altText="Prestige Photo - Services photographiques professionnels"
    className={className}
  />
);

// Publicité Prestige Photo format vertical 300x600
export const PrestigePhotoHalf: React.FC<{ className?: string }> = ({ className }) => (
  <CustomAdBanner 
    width={300}
    height={600}
    imageUrl="/ads/prestige-photo-300x600.jpg"
    clickUrl="https://prestige-photo.fr/"
    altText="Prestige Photo - Photographie professionnelle de qualité"
    className={className}
  />
);

// Composant adaptable qui choisit le bon format selon la taille
export const PrestigePhotoAd: React.FC<{ 
  format: 'medium' | 'half';
  className?: string;
}> = ({ format, className }) => {
  if (format === 'half') {
    return <PrestigePhotoHalf className={className} />;
  }
  return <PrestigePhotoMedium className={className} />;
};
