import React, { createContext, useContext, useState, useEffect, ReactNode, FC } from 'react';

// Types pour les préférences des cookies
export interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

// Interface du contexte
interface CookieContextType {
  preferences: CookiePreferences | null;
  hasConsent: boolean;
  updatePreferences: (newPreferences: CookiePreferences) => void;
  clearConsent: () => void;
  canUseAnalytics: boolean;
  canUseMarketing: boolean;
  canUseFunctional: boolean;
}

// Création du contexte
const CookieContext = createContext<CookieContextType | undefined>(undefined);

// Valeurs par défaut des préférences
const defaultPreferences: CookiePreferences = {
  necessary: true, // Toujours activé
  functional: false,
  analytics: false,
  marketing: false,
};

// Props du provider
interface CookieProviderProps {
  children: ReactNode;
}

// Provider du contexte
export const CookieProvider: FC<CookieProviderProps> = ({ children }) => {
  const [preferences, setPreferences] = useState<CookiePreferences | null>(null);
  const [hasConsent, setHasConsent] = useState(false);

  // Chargement des préférences au démarrage
  useEffect(() => {
    const savedPreferences = localStorage.getItem('cookieConsent');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences(parsed);
        setHasConsent(true);
      } catch (error) {
        console.error('Erreur lors du chargement des préférences cookies:', error);
        setPreferences(null);
        setHasConsent(false);
      }
    }
  }, []);

  // Mise à jour des préférences
  const updatePreferences = (newPreferences: CookiePreferences) => {
    const prefsWithNecessary = {
      ...newPreferences,
      necessary: true, // Les cookies nécessaires sont toujours activés
    };
    
    setPreferences(prefsWithNecessary);
    setHasConsent(true);
    localStorage.setItem('cookieConsent', JSON.stringify(prefsWithNecessary));
  };

  // Suppression du consentement
  const clearConsent = () => {
    setPreferences(null);
    setHasConsent(false);
    localStorage.removeItem('cookieConsent');
  };

  // Helpers pour vérifier les permissions
  const canUseAnalytics = preferences?.analytics ?? false;
  const canUseMarketing = preferences?.marketing ?? false;
  const canUseFunctional = preferences?.functional ?? false;

  return (
    <CookieContext.Provider value={{
      preferences,
      hasConsent,
      updatePreferences,
      clearConsent,
      canUseAnalytics,
      canUseMarketing,
      canUseFunctional
    }}>
      {children}
    </CookieContext.Provider>
  );
};

// Hook principal pour utiliser le contexte
export const useCookieConsent = () => {
  const context = useContext(CookieContext);
  if (context === undefined) {
    throw new Error('useCookieConsent doit être utilisé dans un CookieProvider');
  }
  return context;
};

// Hook spécialisé pour les cookies d'analyse
export const useAnalytics = () => {
  const { canUseAnalytics } = useCookieConsent();
  
  useEffect(() => {
    if (canUseAnalytics) {
      // Ici vous pouvez initialiser Google Analytics, etc.
    }
  }, [canUseAnalytics]);
  
  const trackEvent = (eventName: string, properties?: any) => {
    if (canUseAnalytics) {
      // Logique de tracking d'événement
      console.log('Track event:', eventName, properties);
    }
  };

  const trackPageView = (page: string) => {
    if (canUseAnalytics) {
      // Logique de tracking de page
    }
  };
  
  return {
    canUseAnalytics,
    trackEvent,
    trackPageView
  };
};

// Hook spécialisé pour les cookies marketing
export const useMarketing = () => {
  const { canUseMarketing } = useCookieConsent();
  
  useEffect(() => {
    if (canUseMarketing) {
      // Ici vous pouvez initialiser les pixels Facebook, etc.
      console.log('Marketing cookies autorisés');
    } else {
      console.log('Marketing cookies refusés');
    }
  }, [canUseMarketing]);
  
  return canUseMarketing;
};

// Hook spécialisé pour les cookies fonctionnels
export const useFunctional = () => {
  const { canUseFunctional } = useCookieConsent();
  
  useEffect(() => {
    if (canUseFunctional) {
      // Ici vous pouvez activer les fonctionnalités avancées
      console.log('Functional cookies autorisés');
    } else {
      console.log('Functional cookies refusés');
    }
  }, [canUseFunctional]);
  
  return canUseFunctional;
};

// Fonction helper pour accepter tous les cookies
export const acceptAllCookies = (): CookiePreferences => ({
  necessary: true,
  functional: true,
  analytics: true,
  marketing: true,
});

// Fonction helper pour refuser les cookies non-nécessaires
export const acceptNecessaryOnly = (): CookiePreferences => ({
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false,
});
