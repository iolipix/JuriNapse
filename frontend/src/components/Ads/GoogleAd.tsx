import React, { useEffect } from 'react';

interface GoogleAdProps {
  adSlot: string;
  adFormat?: 'auto' | 'rectangle' | 'vertical' | 'horizontal';
  adStyle?: React.CSSProperties;
  className?: string;
}

// Déclaration globale pour TypeScript
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

const GoogleAd: React.FC<GoogleAdProps> = ({ 
  adSlot, 
  adFormat = 'auto', 
  adStyle = { display: 'block' },
  className = ''
}) => {
  useEffect(() => {
    try {
      // Charger l'annonce une fois que le composant est monté
      if (window.adsbygoogle) {
        window.adsbygoogle.push({});
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'annonce Google AdSense:', error);
    }
  }, []);

  return (
    <div className={`google-ad-container ${className}`}>
      <ins
        className="adsbygoogle"
        style={adStyle}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXXXX" // Remplacer par votre ID AdSense
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default GoogleAd;
