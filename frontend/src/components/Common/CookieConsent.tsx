import React, { useState, useEffect } from 'react';
import { X, Settings, Shield, Info } from 'lucide-react';

interface CookieConsentProps {
  onAcceptAll?: () => void;
  onRejectAll?: () => void;
  onSavePreferences?: (preferences: CookiePreferences) => void;
}

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

const CookieConsent: React.FC<CookieConsentProps> = ({
  onAcceptAll,
  onRejectAll,
  onSavePreferences
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Toujours activés
    analytics: false,
    marketing: false,
    functional: false
  });

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà donné son consentement
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // Délai pour que la page se charge complètement
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true
    };
    
    localStorage.setItem('cookie-consent', JSON.stringify({
      preferences: allAccepted,
      timestamp: new Date().toISOString(),
      version: '1.0'
    }));
    
    setIsVisible(false);
    onAcceptAll?.();
  };

  const handleRejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false
    };
    
    localStorage.setItem('cookie-consent', JSON.stringify({
      preferences: onlyNecessary,
      timestamp: new Date().toISOString(),
      version: '1.0'
    }));
    
    setIsVisible(false);
    onRejectAll?.();
  };

  const handleSavePreferences = () => {
    localStorage.setItem('cookie-consent', JSON.stringify({
      preferences,
      timestamp: new Date().toISOString(),
      version: '1.0'
    }));
    
    setIsVisible(false);
    onSavePreferences?.(preferences);
  };

  const handlePreferenceChange = (key: keyof CookiePreferences, value: boolean) => {
    if (key === 'necessary') return; // Les cookies nécessaires ne peuvent pas être désactivés
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" />
      
      {/* Bannière de consentement */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="max-w-7xl mx-auto p-6">
          {!showDetails ? (
            // Vue simplifiée
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Shield className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Respect de votre vie privée
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Nous utilisons des cookies et technologies similaires pour améliorer votre expérience, 
                      analyser notre trafic et personnaliser le contenu. Vous pouvez choisir quels cookies accepter.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="flex gap-2 text-sm">
                  <button
                    onClick={() => setShowDetails(true)}
                    className="text-blue-600 hover:text-blue-700 underline flex items-center gap-1"
                  >
                    <Settings className="h-4 w-4" />
                    Personnaliser
                  </button>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleRejectAll}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Refuser tout
                  </button>
                  <button
                    onClick={handleAcceptAll}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Accepter tout
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Vue détaillée avec options
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <Shield className="h-6 w-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Paramètres des cookies
                  </h3>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6 mb-6">
                {/* Cookies nécessaires */}
                <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1 pr-4">
                    <h4 className="font-medium text-gray-900 mb-1">Cookies nécessaires</h4>
                    <p className="text-sm text-gray-600">
                      Ces cookies sont essentiels au fonctionnement du site et ne peuvent pas être désactivés. 
                      Ils incluent l'authentification et les préférences de base.
                    </p>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 mr-2">Toujours actif</span>
                    <div className="w-10 h-6 bg-green-500 rounded-full flex items-center">
                      <div className="w-4 h-4 bg-white rounded-full ml-5 transform transition-transform"></div>
                    </div>
                  </div>
                </div>

                {/* Cookies analytiques */}
                <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1 pr-4">
                    <h4 className="font-medium text-gray-900 mb-1">Cookies analytiques</h4>
                    <p className="text-sm text-gray-600">
                      Ces cookies nous aident à comprendre comment vous utilisez le site pour améliorer votre expérience.
                    </p>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(e) => handlePreferenceChange('analytics', e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-10 h-6 rounded-full flex items-center transition-colors ${
                      preferences.analytics ? 'bg-blue-600' : 'bg-gray-300'
                    }`}>
                      <div className={`w-4 h-4 bg-white rounded-full transform transition-transform ${
                        preferences.analytics ? 'translate-x-5' : 'translate-x-1'
                      }`}></div>
                    </div>
                  </label>
                </div>

                {/* Cookies marketing */}
                <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1 pr-4">
                    <h4 className="font-medium text-gray-900 mb-1">Cookies marketing</h4>
                    <p className="text-sm text-gray-600">
                      Ces cookies permettent de vous proposer du contenu et des publicités personnalisés.
                    </p>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.marketing}
                      onChange={(e) => handlePreferenceChange('marketing', e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-10 h-6 rounded-full flex items-center transition-colors ${
                      preferences.marketing ? 'bg-blue-600' : 'bg-gray-300'
                    }`}>
                      <div className={`w-4 h-4 bg-white rounded-full transform transition-transform ${
                        preferences.marketing ? 'translate-x-5' : 'translate-x-1'
                      }`}></div>
                    </div>
                  </label>
                </div>

                {/* Cookies fonctionnels */}
                <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1 pr-4">
                    <h4 className="font-medium text-gray-900 mb-1">Cookies fonctionnels</h4>
                    <p className="text-sm text-gray-600">
                      Ces cookies améliorent les fonctionnalités et la personnalisation du site.
                    </p>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.functional}
                      onChange={(e) => handlePreferenceChange('functional', e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-10 h-6 rounded-full flex items-center transition-colors ${
                      preferences.functional ? 'bg-blue-600' : 'bg-gray-300'
                    }`}>
                      <div className={`w-4 h-4 bg-white rounded-full transform transition-transform ${
                        preferences.functional ? 'translate-x-5' : 'translate-x-1'
                      }`}></div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <div className="flex gap-3">
                  <button
                    onClick={handleRejectAll}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Refuser tout
                  </button>
                  <button
                    onClick={handleSavePreferences}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Confirmer mes choix
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CookieConsent;
