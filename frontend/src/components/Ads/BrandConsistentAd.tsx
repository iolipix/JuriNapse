import React from 'react';
import CustomAdBanner from './CustomAdBanner';

// Configuration des publicités par marque
interface AdConfig {
  id: string;
  imageUrl: string;
  clickUrl: string;
  altText: string;
  width: number;
  height: number;
}

// 🎯 PRESTIGE PHOTO - Toutes les tailles
const PRESTIGE_PHOTO_ADS: AdConfig[] = [
  {
    id: 'prestige-photo-medium',
    imageUrl: '/ads/prestige-photo-300x250.jpg',
    clickUrl: 'https://prestige-photo.fr/',
    altText: 'Prestige Photo - Services photographiques professionnels',
    width: 300,
    height: 250
  },
  {
    id: 'prestige-photo-half',
    imageUrl: '/ads/prestige-photo-300x600.jpg',
    clickUrl: 'https://prestige-photo.fr/',
    altText: 'Prestige Photo - Photographie professionnelle de qualité',
    width: 300,
    height: 600
  }
];

// 🤖 AI WEB - Toutes les tailles
const AI_WEB_ADS: AdConfig[] = [
  {
    id: 'ai-web-medium',
    imageUrl: '/ads/ai-web-300x250.jpg',
    clickUrl: 'https://ai-web.fr/',
    altText: 'AI Web - Solutions intelligence artificielle web',
    width: 300,
    height: 250
  },
  {
    id: 'ai-web-half',
    imageUrl: '/ads/ai-web-300x600.jpg',
    clickUrl: 'https://ai-web.fr/',
    altText: 'AI Web - Développement web avec intelligence artificielle',
    width: 300,
    height: 600
  }
];

// Types de marques disponibles
type AdBrand = 'prestige-photo' | 'ai-web';

// Hook pour sélectionner une marque aléatoirement
const useRandomBrand = (): AdBrand => {
  // Choix aléatoire entre les deux marques (50/50)
  return Math.random() < 0.5 ? 'prestige-photo' : 'ai-web';
};

// Hook pour obtenir une publicité d'une marque spécifique selon la taille
const useAdByBrand = (
  brand: AdBrand,
  preferredWidth?: number,
  preferredHeight?: number
): AdConfig => {
  const adsCollection = brand === 'prestige-photo' ? PRESTIGE_PHOTO_ADS : AI_WEB_ADS;
  
  // Filtrer par taille si spécifiée
  let availableAds = adsCollection;
  if (preferredWidth && preferredHeight) {
    const filtered = adsCollection.filter(ad => 
      ad.width === preferredWidth && ad.height === preferredHeight
    );
    if (filtered.length > 0) {
      availableAds = filtered;
    }
  }
  
  // Prendre la première publicité correspondante (ou la première si aucune ne correspond)
  return availableAds[0] || adsCollection[0];
};

// Session storage key pour maintenir la cohérence sur une session
const SESSION_BRAND_KEY = 'jurinapse_ad_brand_session';

// Hook pour obtenir une marque cohérente pendant la session
const useSessionBrand = (): AdBrand => {
  // Essayer de récupérer la marque de la session
  let sessionBrand: AdBrand;
  
  try {
    const stored = sessionStorage.getItem(SESSION_BRAND_KEY);
    if (stored && (stored === 'prestige-photo' || stored === 'ai-web')) {
      sessionBrand = stored as AdBrand;
    } else {
      // Première visite de la session, choisir aléatoirement
      sessionBrand = Math.random() < 0.5 ? 'prestige-photo' : 'ai-web';
      sessionStorage.setItem(SESSION_BRAND_KEY, sessionBrand);
    }
  } catch {
    // Fallback si sessionStorage n'est pas disponible
    sessionBrand = Math.random() < 0.5 ? 'prestige-photo' : 'ai-web';
  }
  
  return sessionBrand;
};

// Composant principal pour publicité avec marque cohérente
interface BrandConsistentAdProps {
  width?: number;
  height?: number;
  className?: string;
  forceRandomBrand?: boolean; // Pour forcer un nouveau choix aléatoire
}

export const BrandConsistentAd: React.FC<BrandConsistentAdProps> = ({
  width,
  height,
  className,
  forceRandomBrand = false
}) => {
  // Choisir la marque (cohérente pour la session ou aléatoire)
  const sessionBrand = useSessionBrand();
  const randomBrand = useRandomBrand();
  const selectedBrand = forceRandomBrand ? randomBrand : sessionBrand;
  
  // Obtenir la publicité correspondante
  const selectedAd = useAdByBrand(selectedBrand, width, height);
  
  // Utiliser les dimensions demandées ou celles de la publicité
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

// Composants spécifiques pour chaque marque (si besoin de forcer)
export const PrestigePhotoOnlyAd: React.FC<{ width?: number; height?: number; className?: string }> = ({ 
  width, height, className 
}) => {
  const selectedAd = useAdByBrand('prestige-photo', width, height);
  return (
    <CustomAdBanner
      width={width || selectedAd.width}
      height={height || selectedAd.height}
      imageUrl={selectedAd.imageUrl}
      clickUrl={selectedAd.clickUrl}
      altText={selectedAd.altText}
      className={className}
    />
  );
};

export const AIWebOnlyAd: React.FC<{ width?: number; height?: number; className?: string }> = ({ 
  width, height, className 
}) => {
  const selectedAd = useAdByBrand('ai-web', width, height);
  return (
    <CustomAdBanner
      width={width || selectedAd.width}
      height={height || selectedAd.height}
      imageUrl={selectedAd.imageUrl}
      clickUrl={selectedAd.clickUrl}
      altText={selectedAd.altText}
      className={className}
    />
  );
};

export default BrandConsistentAd;