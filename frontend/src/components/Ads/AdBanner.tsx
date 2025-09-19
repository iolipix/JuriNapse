import React, { useEffect, useRef } from 'react';
import { useAds } from './AdProvider';
import { AdProps } from './types';
import { RandomAdBanner } from './RandomAdBanner';
import { usePremiumStatus } from '../../hooks/usePremiumStatus';

const AdBanner: React.FC<AdProps> = ({ 
  slot, 
  size = [300, 250], 
  format = 'auto',
  className = '',
  responsive = true,
  testMode 
}) => {
  const { config, isLoaded } = useAds();
  const adRef = useRef<HTMLDivElement>(null);
  const [width, height] = size;
  
  // Vérifier si l'utilisateur est premium
  const { isPremium } = usePremiumStatus();
  
  // Si l'utilisateur est premium, ne pas afficher de publicité
  if (isPremium) {
    return null;
  }

  // Déterminer si on est en mode test
  const isTestMode = testMode ?? config.testMode;

  useEffect(() => {
    if (!config.enabled || !isLoaded || !adRef.current) return;

    try {
      // Initialiser la publicité
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('❌ Erreur initialisation banner:', err);
    }
  }, [isLoaded, config.enabled, slot]);

  // Si les ads sont désactivées ou en cas d'erreur, ne rien afficher
  if (!config.enabled) return null;

  // Afficher les publicités aléatoires à la place des tests
  if (isTestMode) {
    // Utiliser le système de publicités aléatoires
    return <RandomAdBanner width={width} height={height} className={className} />;
  }

  return (
    <div className={`ad-container ${className}`} ref={adRef}>
      <ins
        className="adsbygoogle"
        style={{ 
          display: 'inline-block',
          width: responsive ? '100%' : width,
          height: height
        }}
        data-ad-client={config.clientId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
};

export default AdBanner;
