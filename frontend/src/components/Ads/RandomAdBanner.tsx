import React from 'react';
import CustomAdBanner from './CustomAdBanner';

// Configuration des publicités disponibles
export interface AdConfig {
  id: string;
  imageUrl: string;
  clickUrl: string;
  altText: string;
  width: number;
  height: number;
}

// Liste de toutes les publicités disponibles
export const ALL_ADS: AdConfig[] = [
  // Prestige Photo - format rectangulaire
  {
    id: 'prestige-photo-medium',
    imageUrl: '/ads/prestige-photo-300x250.jpg',
    clickUrl: 'https://prestige-photo.fr/',
    altText: 'Prestige Photo - Services photographiques professionnels',
    width: 300,
    height: 250
  },
  // Prestige Photo - format vertical
  {
    id: 'prestige-photo-half',
    imageUrl: '/ads/prestige-photo-300x600.jpg',
    clickUrl: 'https://prestige-photo.fr/',
    altText: 'Prestige Photo - Photographie professionnelle de qualité',
    width: 300,
    height: 600
  },
  // Nouvelle publicité - Format post
  {
    id: 'format-post',
    imageUrl: '/ads/format-post.png',
    clickUrl: '#', // Remplacez par l'URL de destination souhaitée
    altText: 'Format post - Publicité',
    width: 300,
    height: 250
  },
  // Nouvelle publicité - Format profil
  {
    id: 'format-profil',
    imageUrl: '/ads/format-profil.png',
    clickUrl: '#', // Remplacez par l'URL de destination souhaitée
    altText: 'Format profil - Publicité',
    width: 300,
    height: 250
  }
];

// Hook pour obtenir une publicité aléatoire selon les critères
export const useRandomAd = (
  preferredWidth?: number, 
  preferredHeight?: number,
  excludeIds?: string[]
) => {
  // Filtrer les publicités selon les critères
  let availableAds = ALL_ADS;

  // Filtrer par taille si spécifiée
  if (preferredWidth && preferredHeight) {
    availableAds = availableAds.filter(ad => 
      ad.width === preferredWidth && ad.height === preferredHeight
    );
  }

  // Exclure certaines publicités si demandé
  if (excludeIds && excludeIds.length > 0) {
    availableAds = availableAds.filter(ad => !excludeIds.includes(ad.id));
  }

  // Si aucune publicité ne correspond aux critères, prendre toutes les publicités
  if (availableAds.length === 0) {
    availableAds = ALL_ADS;
  }

  // Sélectionner une publicité aléatoire
  const randomIndex = Math.floor(Math.random() * availableAds.length);
  return availableAds[randomIndex];
};

// Composant pour afficher une publicité aléatoire
interface RandomAdBannerProps {
  width?: number;
  height?: number;
  className?: string;
  excludeIds?: string[];
  fallbackToAnySize?: boolean;
}

export const RandomAdBanner: React.FC<RandomAdBannerProps> = ({
  width,
  height,
  className,
  excludeIds,
  fallbackToAnySize = true
}) => {
  // Sélectionner une publicité aléatoire à chaque rendu
  const selectedAd = useRandomAd(width, height, excludeIds);

  // Si on a des dimensions spécifiques mais que l'ad sélectionnée ne correspond pas,
  // utiliser les dimensions demandées
  const finalWidth = width || selectedAd.width;
  const finalHeight = height || selectedAd.height;

  return (
    <CustomAdBanner
      width={finalWidth}
      height={finalHeight}
      imageUrl={selectedAd.imageUrl}
      clickUrl={selectedAd.clickUrl}
      altText={selectedAd.altText}
      className={className}
    />
  );
};

// Composants prédéfinis pour la compatibilité avec l'existant
export const PrestigePhotoMedium: React.FC<{ className?: string }> = ({ className }) => (
  <RandomAdBanner 
    width={300}
    height={250}
    className={className}
  />
);

export const PrestigePhotoHalf: React.FC<{ className?: string }> = ({ className }) => (
  <RandomAdBanner 
    width={300}
    height={600}
    className={className}
  />
);

// Composant principal qui choisit aléatoirement parmi toutes les publicités
export const RandomAd: React.FC<{ 
  format?: 'medium' | 'half' | 'any';
  className?: string;
}> = ({ format = 'any', className }) => {
  
  switch (format) {
    case 'medium':
      return <RandomAdBanner width={300} height={250} className={className} />;
    case 'half':
      return <RandomAdBanner width={300} height={600} className={className} />;
    case 'any':
    default:
      return <RandomAdBanner className={className} />;
  }
};

export default RandomAdBanner;