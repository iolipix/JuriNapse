import React, { useEffect, useRef, useState } from 'react';
import { useAds } from './AdProvider';
import { AdProps } from './types';
import { usePremiumStatus } from '../../hooks/usePremiumStatus';

interface AdFeedNativeProps extends Omit<AdProps, 'format'> {
  title?: string;
  index?: number; // Index dans le feed pour le tracking
}

const AdFeedNative: React.FC<AdFeedNativeProps> = ({ 
  slot, 
  className = '',
  testMode,
  title = "Contenu sponsorisé",
  index = 0
}) => {
  const { isPremium } = usePremiumStatus();
  const { config, isLoaded } = useAds();
  const adRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Ne pas afficher de pub pour les utilisateurs premium
  if (isPremium) {
    return null;
  }

  // Déterminer si on est en mode test
  const isTestMode = testMode ?? config.testMode;

  // Observer la visibilité pour lazy loading
  useEffect(() => {
    if (!adRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(adRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!config.enabled || !isLoaded || !isVisible || !adRef.current) return;

    try {
      // Initialiser la publicité native
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('❌ Erreur initialisation native ad:', err);
    }
  }, [isLoaded, config.enabled, slot, isVisible, index]);

  // Si les ads sont désactivées, ne rien afficher
  if (!config.enabled) return null;

  // Placeholder en mode test
  if (isTestMode) {
    return (
      <div 
        className={`bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 my-4 ${className}`}
        ref={adRef}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">
            {title}
          </span>
          <span className="text-xs text-gray-500">Position #{index + 1}</span>
        </div>
        
        <div className="flex gap-4">
          {/* Image placeholder */}
          <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">🎯</span>
          </div>
          
          {/* Contenu */}
          <div className="flex-1">
            <h3 className="font-semibold text-gray-700 mb-2">Publicité Test Native</h3>
            <p className="text-sm text-gray-600 mb-2">
              Ceci est une publicité native de test pour JuriNapse. 
              Elle s'intègre naturellement dans le feed de contenu.
            </p>
            <div className="flex items-center gap-2">
              <button className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 transition-colors">
                En savoir plus
              </button>
              <span className="text-xs text-gray-500">Slot: {slot}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`ad-native-container ${className}`} ref={adRef}>
      {/* Indicateur de contenu sponsorisé */}
      <div className="text-xs text-gray-500 mb-2 font-medium">
        {title}
      </div>
      
      {/* Publicité Google Ads native */}
      {isVisible && (
        <ins
          className="adsbygoogle"
          style={{ 
            display: 'block',
            textAlign: 'center'
          }}
          data-ad-layout="in-article"
          data-ad-format="fluid"
          data-ad-client={config.clientId}
          data-ad-slot={slot}
        />
      )}
    </div>
  );
};

export default AdFeedNative;
