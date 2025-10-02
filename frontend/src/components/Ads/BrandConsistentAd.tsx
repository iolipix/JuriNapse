import React, { useState, useEffect } from 'react';
import CustomAdBanner from './CustomAdBanner';
import { usePremiumStatus } from '../../hooks/usePremiumStatus';

// Déclaration pour AdSense
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

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
    imageUrl: '/ads/ai-web-300x250.png',
    clickUrl: 'https://www.aiaweb.fr/',
    altText: 'AIAWEB - Consulting, Web développement, IA & Automatisation',
    width: 300,
    height: 250
  },
  {
    id: 'ai-web-half',
    imageUrl: '/ads/ai-web-300x600.png',
    clickUrl: 'https://www.aiaweb.fr/',
    altText: 'AIAWEB - Révélez tout le potentiel digital de votre entreprise',
    width: 300,
    height: 600
  }
];

// Types de marques disponibles
type AdBrand = 'prestige-photo' | 'ai-web';

// Hook pour générer une marque aléatoire stable par instance
const useRandomBrand = (): AdBrand => {
  // CRITICAL FIX: Utiliser useMemo au lieu de useState/useEffect pour éviter React error #310
  const brand = React.useMemo(() => {
    // Générer aléatoirement une marque pour cette instance (50/50)
    return Math.random() < 0.5 ? 'prestige-photo' : 'ai-web';
  }, []); // Le tableau vide assure que c'est généré une seule fois

  return brand;
};

// Hook pour obtenir une publicité d'une marque spécifique selon la taille
const useAdByBrand = (
  brand: AdBrand,
  preferredWidth?: number,
  preferredHeight?: number
): AdConfig => {
  // CRITICAL FIX: Utiliser useMemo pour éviter React error #310
  return React.useMemo(() => {
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
  }, [brand, preferredWidth, preferredHeight]);
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

// Composant principal pour publicité aléatoire par instance
interface RandomInstanceAdProps {
  width?: number;
  height?: number;
  className?: string;
}

export const RandomInstanceAd: React.FC<RandomInstanceAdProps> = ({
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

  // Choisir le slot selon la taille
  const getAdSlot = () => {
    // Format vertical/sidebar (300x600 ou similaire)
    if (height >= 500) {
      return '8064995414'; // Slot vertical
    }
    // Format rectangle/feed (300x250 ou similaire)
    return '7585008486'; // Slot feed native
  };

  React.useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('❌ Erreur AdSense:', err);
    }
  }, []);

  // ID unique pour forcer le rechargement AdSense
  const adId = React.useMemo(() => `adsense-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, []);

  return (
    <div className={`google-adsense ${className || ''}`} key={adId}>
      <ins 
        className="adsbygoogle"
        style={{ display: 'block', width: `${width}px`, height: `${height}px` }}
        data-ad-client="ca-pub-1676150794227736"
        data-ad-slot={getAdSlot()}
        data-ad-format="auto"
        data-full-width-responsive="true"
        id={adId}
      />
    </div>
  );
};

// Composants spécifiques pour chaque marque (si besoin de forcer)
export const PrestigePhotoOnlyAd: React.FC<{ width?: number; height?: number; className?: string }> = ({ 
  width, height, className 
}) => {
  // Vérifier si l'utilisateur est premium
  const { isPremium } = usePremiumStatus();
  
  // Si l'utilisateur est premium, ne pas afficher de publicité
  if (isPremium) {
    return null;
  }

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
  // Vérifier si l'utilisateur est premium
  const { isPremium } = usePremiumStatus();
  
  // Si l'utilisateur est premium, ne pas afficher de publicité
  if (isPremium) {
    return null;
  }

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

// Alias pour la compatibilité (utilise le même système aléatoire)
export const BrandConsistentAd = RandomInstanceAd;

export default RandomInstanceAd;