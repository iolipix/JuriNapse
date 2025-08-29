import React, { useEffect, useRef } from 'react';
import { useAds } from './AdProvider';
import { AdProps } from './types';

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

  // Placeholder en mode test
  if (isTestMode) {
    return (
      <div 
        className={`bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-500 text-sm ${className}`}
        style={{ width: width, height: height }}
      >
        <div className="text-center">
          <div className="font-semibold">🎯 Publicité Test</div>
          <div className="text-xs mt-1">Bannière {width}x{height}</div>
          <div className="text-xs">Slot: {slot}</div>
        </div>
      </div>
    );
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
