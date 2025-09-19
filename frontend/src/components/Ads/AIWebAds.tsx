import React from 'react';
import { RandomAdBanner } from './RandomAdBanner';

// 🤖 Composants prédéfinis pour AI Web avec rotation aléatoire
// Note: Ces composants utilisent maintenant le système de rotation aléatoire
// qui inclut AI Web, Prestige Photo et toutes les autres publicités

// Publicité AI Web format rectangulaire 300x250 (rotation aléatoire)
export const AIWebMedium: React.FC<{ className?: string }> = ({ className }) => (
  <RandomAdBanner 
    width={300}
    height={250}
    className={className}
  />
);

// Publicité AI Web format vertical 300x600 (rotation aléatoire)
export const AIWebHalf: React.FC<{ className?: string }> = ({ className }) => (
  <RandomAdBanner 
    width={300}
    height={600}
    className={className}
  />
);

// Composant adaptable qui choisit le bon format selon la taille (rotation aléatoire)
export const AIWebAd: React.FC<{ 
  format: 'medium' | 'half';
  className?: string;
}> = ({ format, className }) => {
  if (format === 'half') {
    return <AIWebHalf className={className} />;
  }
  return <AIWebMedium className={className} />;
};