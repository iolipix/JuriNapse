import React, { useEffect, useRef } from 'react';
import { useAds } from './AdProvider';
import { AdProps } from './types';
import { PrestigePhotoMedium, PrestigePhotoHalf } from './PrestigePhotoAds';

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

  // Afficher les publicités Prestige Photo à la place des tests
  if (isTestMode) {
    // Choisir le bon format selon la taille
    if (width === 300 && height === 600) {
      return <PrestigePhotoHalf className={className} />;
    } else if (width === 300 && height === 250) {
      return <PrestigePhotoMedium className={className} />;
    } else {
      // Pour les autres tailles, afficher Prestige Photo Medium par défaut
      return <PrestigePhotoMedium className={className} />;
    }
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
