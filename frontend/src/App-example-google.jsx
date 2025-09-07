// 📊 Exemple d'intégration Google Analytics dans App.jsx/tsx
// Copiez ce code dans votre composant principal

import React, { useEffect } from 'react';
import { initializeGA, trackPageView, useGoogleAnalytics } from './utils/googleAnalytics.js';
import CookieConsent from './components/CookieConsent.jsx';

function App() {
  const { trackEvent, events } = useGoogleAnalytics();

  // Initialisation au démarrage de l'app
  useEffect(() => {
    // Vérifier si le consentement Analytics a été donné
    const analyticsConsent = localStorage.getItem('analytics_consent');
    
    if (analyticsConsent === 'true') {
      // Initialiser Google Analytics
      initializeGA();
      
      // Tracker la première page vue
      trackPageView('Home', window.location.href);
      
      console.log('✅ Google Analytics initialisé avec ID: G-3NV8LWDG0D');
    }
  }, []);

  // Exemple d'utilisation du tracking dans vos composants
  const handleUserLogin = (userData) => {
    // Votre logique de connexion...
    
    // Tracking Google Analytics
    events.login('email');
    console.log('📊 Connexion trackée');
  };

  const handleUserRegister = (userData) => {
    // Votre logique d'inscription...
    
    // Tracking Google Analytics
    events.register('email');
    console.log('📊 Inscription trackée');
  };

  const handlePostCreation = (postData) => {
    // Votre logique de création de post...
    
    // Tracking Google Analytics
    events.createPost(postData.type || 'general');
    console.log('📊 Création de post trackée');
  };

  const handleSearch = (searchTerm) => {
    // Votre logique de recherche...
    
    // Tracking Google Analytics
    events.search(searchTerm);
    console.log('📊 Recherche trackée:', searchTerm);
  };

  return (
    <div className="App">
      {/* Votre contenu existant */}
      
      {/* Bannière de consentement RGPD */}
      <CookieConsent />
      
      {/* Exemples de boutons avec tracking */}
      <button onClick={() => handleSearch('droit civil')}>
        Rechercher "droit civil"
      </button>
      
      <button onClick={() => trackEvent('custom_action', { label: 'test' })}>
        Action personnalisée
      </button>
    </div>
  );
}

export default App;
