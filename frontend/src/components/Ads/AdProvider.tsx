import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AdConfig, AdContextType } from './types';

const AdContext = createContext<AdContextType | null>(null);

interface AdProviderProps {
  children: ReactNode;
}

export const AdProvider: React.FC<AdProviderProps> = ({ children }) => {
  const [config] = useState<AdConfig>({
    enabled: true, // Hardcodé pour debug
    testMode: true, // Hardcodé pour debug
    clientId: 'ca-pub-1676150794227736' // Hardcodé pour debug
  });

  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!config.enabled) return;

    // Charger le script Google Ads seulement si activé
    loadGoogleAdsScript();
  }, [config.enabled]);

  const loadGoogleAdsScript = async () => {
    try {
      // Vérifier si le script est déjà chargé
      if (window.adsbygoogle) {
        setIsLoaded(true);
        return;
      }

      // Créer et injecter le script Google Ads
      const script = document.createElement('script');
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.clientId}`;
      script.async = true;
      script.crossOrigin = 'anonymous';

      script.onload = () => {
        setIsLoaded(true);
        setError(null);
      };

      script.onerror = () => {
        console.error('❌ Erreur lors du chargement du script Google Ads');
        setError('Erreur lors du chargement des publicités');
        setIsLoaded(false);
      };

      document.head.appendChild(script);

      // Timeout de sécurité
      setTimeout(() => {
        if (!isLoaded) {
          setError('Timeout lors du chargement des publicités');
        }
      }, 10000);

    } catch (err) {
      console.error('❌ Erreur configuration Google Ads:', err);
      setError('Erreur de configuration des publicités');
    }
  };

  const refreshAd = (slotId: string) => {
    if (!isLoaded || !window.adsbygoogle) return;

    try {
      // Rafraîchir une publicité spécifique
      const adElement = document.querySelector(`[data-ad-slot="${slotId}"]`);
      if (adElement) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        console.log(`🔄 Publicité ${slotId} rafraîchie`);
      }
    } catch (err) {
      console.error(`❌ Erreur lors du rafraîchissement de la pub ${slotId}:`, err);
    }
  };

  const contextValue: AdContextType = {
    config,
    isLoaded,
    error,
    refreshAd
  };

  return (
    <AdContext.Provider value={contextValue}>
      {children}
    </AdContext.Provider>
  );
};

export const useAds = (): AdContextType => {
  const context = useContext(AdContext);
  if (!context) {
    throw new Error('useAds doit être utilisé dans un AdProvider');
  }
  return context;
};

// Déclaration globale pour TypeScript
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}
