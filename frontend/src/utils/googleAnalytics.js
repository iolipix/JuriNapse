// 📊 Google Analytics & Ads Integration pour JuriNapse
// Configuration et fonctions utilitaires

// Configuration Google (IDs réels de JuriNapse)
export const GOOGLE_CONFIG = {
  // Google Analytics 4
  GA_MEASUREMENT_ID: 'G-3NV8LWDG0D', // ID réel JuriNapse
  
  // Google Ads - CONFIGURÉ ✅
  GOOGLE_ADS_CLIENT_ID: 'ca-pub-1676150794227736', // ID réel Google Ads
  
  // Conversion Tracking (à configurer avec Google Ads)
  CONVERSIONS: {
    REGISTER: null, // À configurer si Google Ads
    LOGIN: null,    // À configurer si Google Ads
    POST_CREATE: null, // À configurer si Google Ads
    PROFILE_VIEW: null // À configurer si Google Ads
  }
};

// 🔧 Initialisation Google Analytics
export const initializeGA = () => {
  // Ajout du script gtag.js
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_CONFIG.GA_MEASUREMENT_ID}`;
  document.head.appendChild(script1);

  // Configuration gtag
  window.dataLayer = window.dataLayer || [];
  function gtag(){window.dataLayer.push(arguments);}
  window.gtag = gtag;
  
  gtag('js', new Date());
  gtag('config', GOOGLE_CONFIG.GA_MEASUREMENT_ID, {
    // Configuration pour respecter RGPD
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  });

  // Configuration Google Ads si présent
  if (GOOGLE_CONFIG.GOOGLE_ADS_ID) {
    gtag('config', GOOGLE_CONFIG.GOOGLE_ADS_ID);
  }

  console.log('✅ Google Analytics initialisé');
};

// 📈 Tracking des événements
export const trackEvent = (eventName, parameters = {}) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, {
      event_category: 'User Interaction',
      event_label: parameters.label || '',
      value: parameters.value || 0,
      ...parameters
    });
    console.log(`📊 Event tracked: ${eventName}`, parameters);
  }
};

// 🎯 Tracking des conversions Google Ads
export const trackConversion = (conversionId, value = 0, currency = 'EUR') => {
  if (typeof window.gtag === 'function' && conversionId) {
    window.gtag('event', 'conversion', {
      send_to: conversionId,
      value: value,
      currency: currency
    });
    console.log(`🎯 Conversion tracked: ${conversionId}`, { value, currency });
  }
};

// 📄 Tracking des pages vues
export const trackPageView = (page_title, page_location) => {
  if (typeof window.gtag === 'function') {
    window.gtag('config', GOOGLE_CONFIG.GA_MEASUREMENT_ID, {
      page_title: page_title,
      page_location: page_location
    });
    console.log(`📄 Page view tracked: ${page_location}`);
  }
};

// 👤 Tracking des utilisateurs (après connexion)
export const setUserId = (userId) => {
  if (typeof window.gtag === 'function') {
    window.gtag('config', GOOGLE_CONFIG.GA_MEASUREMENT_ID, {
      user_id: userId
    });
    console.log(`👤 User ID set: ${userId}`);
  }
};

// 🏷️ Événements prédéfinis pour JuriNapse
export const trackJuriNapseEvents = {
  // Inscription
  register: (method = 'email') => {
    trackEvent('sign_up', { method });
    trackConversion(GOOGLE_CONFIG.CONVERSIONS.REGISTER);
  },

  // Connexion
  login: (method = 'email') => {
    trackEvent('login', { method });
    trackConversion(GOOGLE_CONFIG.CONVERSIONS.LOGIN);
  },

  // Création de post
  createPost: (postType = 'general') => {
    trackEvent('create_post', { 
      event_category: 'Content',
      event_label: postType 
    });
    trackConversion(GOOGLE_CONFIG.CONVERSIONS.POST_CREATE);
  },

  // Vue de profil
  viewProfile: (profileId) => {
    trackEvent('view_profile', { 
      event_category: 'Social',
      event_label: profileId 
    });
    trackConversion(GOOGLE_CONFIG.CONVERSIONS.PROFILE_VIEW);
  },

  // Recherche
  search: (searchTerm) => {
    trackEvent('search', { 
      search_term: searchTerm,
      event_category: 'Navigation'
    });
  },

  // Interaction sociale
  like: (contentType, contentId) => {
    trackEvent('like', { 
      event_category: 'Social',
      event_label: `${contentType}_${contentId}`
    });
  },

  // Navigation
  navigate: (fromPage, toPage) => {
    trackEvent('page_navigation', {
      event_category: 'Navigation',
      from_page: fromPage,
      to_page: toPage
    });
  }
};

// 🛡️ Consentement RGPD
export const setConsentMode = (analytics = false, ads = false) => {
  if (typeof window.gtag === 'function') {
    window.gtag('consent', 'update', {
      analytics_storage: analytics ? 'granted' : 'denied',
      ad_storage: ads ? 'granted' : 'denied'
    });
    console.log(`🛡️ Consent updated: Analytics=${analytics}, Ads=${ads}`);
  }
};

// 🎯 Hook React pour l'intégration facile
export const useGoogleAnalytics = () => {
  return {
    trackEvent,
    trackConversion,
    trackPageView,
    setUserId,
    setConsentMode,
    events: trackJuriNapseEvents
  };
};
