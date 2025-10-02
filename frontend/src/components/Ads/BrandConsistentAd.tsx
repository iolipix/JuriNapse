import React from 'react';
import { usePremiumStatus } from '../../hooks/usePremiumStatus';

// Déclaration pour AdSense
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

// Props pour le composant principal
interface AdProps {
  width?: number;
  height?: number;
  className?: string;
}

// Composant principal AdSense
export const RandomInstanceAd: React.FC<AdProps> = ({
  width = 300,
  height = 250,
  className = ''
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
  const adId = React.useMemo(() => 
    `adsense-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
    []
  );

  return (
    <div className={`google-adsense ${className}`} style={{ width: `${width}px`, margin: '0 auto' }}>
      <ins 
        className="adsbygoogle"
        style={{ 
          display: 'inline-block', 
          width: `${width}px`, 
          height: `${height}px`
        }}
        data-ad-client="ca-pub-1676150794227736"
        data-ad-slot={getAdSlot()}
        data-ad-format={height >= 500 ? "auto" : "rectangle"}
        data-full-width-responsive={height >= 500 ? "true" : "false"}
        id={adId}
      />
    </div>
  );
};

// Composants de compatibilité (maintenant tous utilisent AdSense)
export const PrestigePhotoOnlyAd: React.FC<AdProps> = (props) => <RandomInstanceAd {...props} />;
export const AIWebOnlyAd: React.FC<AdProps> = (props) => <RandomInstanceAd {...props} />;

// Alias pour la compatibilité
export const BrandConsistentAd = RandomInstanceAd;

export default RandomInstanceAd;