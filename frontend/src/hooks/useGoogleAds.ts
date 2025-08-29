import { useEffect } from 'react';

// Configuration AdSense
const ADSENSE_CLIENT_ID = 'ca-pub-XXXXXXXXXXXXXXXXXX'; // Remplacer par votre vrai ID
const ADSENSE_SCRIPT_URL = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;

export const useGoogleAds = () => {
  useEffect(() => {
    // Vérifier si le script AdSense est déjà chargé
    const existingScript = document.querySelector(`script[src="${ADSENSE_SCRIPT_URL}"]`);
    
    if (!existingScript) {
      // Créer et ajouter le script AdSense
      const script = document.createElement('script');
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.src = ADSENSE_SCRIPT_URL;
      
      // Ajouter le script au head
      document.head.appendChild(script);
      
      // Initialiser le tableau adsbygoogle s'il n'existe pas
      if (!window.adsbygoogle) {
        window.adsbygoogle = [];
      }
    }
  }, []);
};

// Types d'annonces recommandés pour votre site juridique
export const AD_SLOTS = {
  // Bannière en haut de page
  HEADER_BANNER: '1234567890',
  
  // Annonce dans la sidebar
  SIDEBAR_AD: '2345678901',
  
  // Annonce entre les posts
  IN_FEED_AD: '3456789012',
  
  // Bannière en bas de page
  FOOTER_BANNER: '4567890123',
  
  // Annonce dans les articles (posts détaillés)
  IN_ARTICLE_AD: '5678901234'
};
