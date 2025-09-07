// 🍪 Composant de gestion du consentement RGPD et tracking Google
import React, { useState, useEffect } from 'react';
import { setConsentMode, initializeGA } from '../utils/googleAnalytics.js';

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);

  useEffect(() => {
    // Vérifier si le consentement a déjà été donné
    const analyticsConsent = localStorage.getItem('analytics_consent');
    const adsConsent = localStorage.getItem('ads_consent');
    
    if (!analyticsConsent) {
      setShowBanner(true);
    } else {
      // Appliquer les consentements sauvegardés
      setConsentMode(
        analyticsConsent === 'true',
        adsConsent === 'true'
      );
      setConsentGiven(true);
      
      // Initialiser Google Analytics si consentement donné
      if (analyticsConsent === 'true') {
        initializeGA();
      }
    }
  }, []);

  const acceptAnalytics = () => {
    setConsentMode(true, false); // Analytics OK, Ads non
    localStorage.setItem('analytics_consent', 'true');
    localStorage.setItem('ads_consent', 'false');
    setShowBanner(false);
    setConsentGiven(true);
    
    // Initialiser Google Analytics
    initializeGA();
  };

  const acceptAll = () => {
    setConsentMode(true, true); // Analytics + Ads OK
    localStorage.setItem('analytics_consent', 'true');
    localStorage.setItem('ads_consent', 'true');
    setShowBanner(false);
    setConsentGiven(true);
    
    // Initialiser Google Analytics
    initializeGA();
  };

  const refuseAll = () => {
    setConsentMode(false, false);
    localStorage.setItem('analytics_consent', 'false');
    localStorage.setItem('ads_consent', 'false');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 shadow-lg z-50">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">🍪 Respect de votre vie privée</h3>
          <p className="text-sm text-gray-300">
            Nous utilisons des cookies pour améliorer votre expérience et analyser notre trafic. 
            Vous pouvez choisir d'accepter uniquement les cookies essentiels ou tous les cookies 
            (y compris publicité).
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={refuseAll}
            className="px-4 py-2 text-sm border border-gray-600 rounded hover:bg-gray-800 transition-colors"
          >
            Refuser tout
          </button>
          <button
            onClick={acceptAnalytics}
            className="px-4 py-2 text-sm bg-blue-600 rounded hover:bg-blue-700 transition-colors"
          >
            Essentiel seulement
          </button>
          <button
            onClick={acceptAll}
            className="px-4 py-2 text-sm bg-green-600 rounded hover:bg-green-700 transition-colors"
          >
            Accepter tout
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
