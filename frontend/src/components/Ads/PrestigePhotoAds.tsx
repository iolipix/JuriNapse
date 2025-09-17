import React from 'react';
import { RandomAdBanner } from './RandomAdBanner';

// Composants prédéfinis pour les publicités avec rotation aléatoire
// Note: Ces composants utilisent maintenant le système de rotation aléatoire
// qui inclut Prestige Photo et les nouvelles publicités

// Publicité format rectangulaire 300x250 (rotation aléatoire)
export const PrestigePhotoMedium: React.FC<{ className?: string }> = ({ className }) => (
  <RandomAdBanner 
    width={300}
    height={250}
    className={className}
  />
);

// Publicité format vertical 300x600 (rotation aléatoire)
export const PrestigePhotoHalf: React.FC<{ className?: string }> = ({ className }) => (
  <RandomAdBanner 
    width={300}
    height={600}
    className={className}
  />
);

// Composant adaptable qui choisit le bon format selon la taille (rotation aléatoire)
export const PrestigePhotoAd: React.FC<{ 
  format: 'medium' | 'half';
  className?: string;
}> = ({ format, className }) => {
  if (format === 'half') {
    return <PrestigePhotoHalf className={className} />;
  }
  return <PrestigePhotoMedium className={className} />;
};
