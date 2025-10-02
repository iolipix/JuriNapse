import React from 'react';
import { usePremiumStatus } from '../../hooks/usePremiumStatus';
import useAdSenseCleanup from '../../hooks/useAdSenseCleanup';

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

  // Paramètres AdSense selon le format
  const getAdParams = () => {
    if (height >= 500) {
      return {
        format: "auto",
        responsive: "true",
        display: "inline-block"
      };
    } else {
      return {
        format: "rectangle", 
        responsive: "false",
        display: "inline-block"
      };
    }
  };

  const adParams = getAdParams();

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
          display: adParams.display, 
          width: `${width}px`, 
          height: `${height}px`
        }}
        data-ad-client="ca-pub-1676150794227736"
        data-ad-slot={getAdSlot()}
        data-ad-format={adParams.format}
        data-full-width-responsive={adParams.responsive}
        id={adId}
      />
    </div>
  );
};

// Composant spécifique pour publicités rectangulaires (feeds)
export const RectangleAd: React.FC<Omit<AdProps, 'width' | 'height'> & { className?: string }> = ({ 
  className = '' 
}) => {
  const { isPremium } = usePremiumStatus();
  useAdSenseCleanup(); // Nettoyer les styles AdSense automatiquement
  
  if (isPremium) {
    return null;
  }

  React.useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('❌ Erreur AdSense Rectangle:', err);
    }
  }, []);

  const adId = React.useMemo(() => 
    `adsense-rect-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
    []
  );

  return (
    <div className={`w-full flex justify-center items-center ${className}`} style={{ maxWidth: '100%', overflow: 'hidden' }}>
      <ins 
        className="adsbygoogle"
        style={{ 
          display: 'block', 
          width: '300px', 
          height: '250px',
          margin: '0 auto',
          border: 'none',
          background: 'transparent',
          boxShadow: 'none',
          outline: 'none'
        }}
        data-ad-client="ca-pub-1676150794227736"
        data-ad-slot="7585008486"
        data-ad-format="rectangle"
        data-full-width-responsive="false"
        id={adId}
      />
    </div>
  );
};

// Composant spécifique pour publicités verticales (sidebars)
export const VerticalAd: React.FC<Omit<AdProps, 'width' | 'height'> & { className?: string }> = ({ 
  className = '' 
}) => {
  const { isPremium } = usePremiumStatus();
  
  if (isPremium) {
    return null;
  }

  React.useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('❌ Erreur AdSense Vertical:', err);
    }
  }, []);

  const adId = React.useMemo(() => 
    `adsense-vert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
    []
  );

  return (
    <div className={`google-adsense flex justify-center items-center w-full ${className}`}>
      <ins 
        className="adsbygoogle"
        style={{ 
          display: 'inline-block', 
          width: '300px', 
          height: '600px',
          margin: '0 auto',
          border: 'none',
          boxShadow: 'none',
          background: 'transparent'
        }}
        data-ad-client="ca-pub-1676150794227736"
        data-ad-slot="8064995414"
        data-ad-format="auto"
        data-full-width-responsive="true"
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