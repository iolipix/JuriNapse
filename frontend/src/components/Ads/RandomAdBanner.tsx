import React, { useEffect } from 'react';
import CustomAdBanner from './CustomAdBanner';
import { usePremiumStatus } from '../../hooks/usePremiumStatus';

// Déclaration pour AdSense
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

// Configuration des publicités disponibles
export interface AdConfig {
  id: string;
  imageUrl: string;
  clickUrl: string;
  altText: string;
  width: number;
  height: number;
}

// Liste de toutes les publicités disponibles - ROTATION ALÉATOIRE
export const ALL_ADS: AdConfig[] = [
  // 🎯 PRESTIGE PHOTO - format rectangulaire
  {
    id: 'prestige-photo-medium',
    imageUrl: '/ads/prestige-photo-300x250.jpg',
    clickUrl: 'https://prestige-photo.fr/',
    altText: 'Prestige Photo - Services photographiques professionnels',
    width: 300,
    height: 250
  },
  // 🎯 PRESTIGE PHOTO - format vertical
  {
    id: 'prestige-photo-half',
    imageUrl: '/ads/prestige-photo-300x600.jpg',
    clickUrl: 'https://prestige-photo.fr/',
    altText: 'Prestige Photo - Photographie professionnelle de qualité',
    width: 300,
    height: 600
  },
  // 🤖 AI WEB - format rectangulaire
  {
    id: 'ai-web-medium',
    imageUrl: '/ads/ai-web-300x250.jpg',
    clickUrl: 'https://ai-web.fr/', // URL AI Web
    altText: 'AI Web - Solutions intelligence artificielle web',
    width: 300,
    height: 250
  },
  // 🤖 AI WEB - format vertical
  {
    id: 'ai-web-half',
    imageUrl: '/ads/ai-web-300x600.jpg',
    clickUrl: 'https://ai-web.fr/', // URL AI Web
    altText: 'AI Web - Développement web avec intelligence artificielle',
    width: 300,
    height: 600
  },
  // 📱 Format post générique
  {
    id: 'format-post',
    imageUrl: '/ads/format-post.png',
    clickUrl: '#', // Remplacez par l'URL de destination souhaitée
    altText: 'Format post - Publicité',
    width: 300,
    height: 250
  },
  // 👤 Format profil générique
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
  width = 300,
  height = 250,
  className
}) => {
  // Vérifier si l'utilisateur est premium
  const { isPremium } = usePremiumStatus();
  
  // Si l'utilisateur est premium, ne pas afficher de publicité
  if (isPremium) {
    return null;
  }

  // TOUJOURS utiliser le slot FEED comme demandé
  const getAdSlot = () => {
    // Toujours le slot feed, peu importe la taille
    return '7585008486'; // Slot feed native
  };

  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('❌ Erreur AdSense:', err);
    }
  }, []);

  return (
    <div className={`google-adsense ${className || ''}`}>
      <ins 
        className="adsbygoogle"
        style={{ display: 'block', width: `${width}px`, height: `${height}px` }}
        data-ad-client="ca-pub-1676150794227736"
        data-ad-slot={getAdSlot()}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
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