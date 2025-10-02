import React, { useEffect } from 'react';

// Déclaration pour AdSense
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface ForceAdSenseProps {
  width?: number;
  height?: number;
  className?: string;
  slot?: 'feed' | 'vertical';
}

export const ForceAdSense: React.FC<ForceAdSenseProps> = ({ 
  width = 300, 
  height = 250, 
  className = '',
  slot = 'feed'
}) => {
  // Déterminer le slot basé sur le paramètre
  const getAdSlot = () => {
    switch (slot) {
      case 'vertical':
        return '8064995414'; // Slot vertical
      case 'feed':
      default:
        return '7585008486'; // Slot feed native
    }
  };

  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('❌ Erreur AdSense:', err);
    }
  }, []);

  return (
    <div className={`google-adsense force-adsense ${className}`} style={{ border: '2px dashed red', padding: '10px' }}>
      <div style={{ fontSize: '12px', color: 'red', marginBottom: '5px' }}>
        TEST AdSense - Slot: {slot} ({getAdSlot()})
      </div>
      <ins 
        className="adsbygoogle"
        style={{ display: 'block', width: `${width}px`, height: `${height}px` }}
        data-ad-client="ca-pub-1676150794227736"
        data-ad-slot={getAdSlot()}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};