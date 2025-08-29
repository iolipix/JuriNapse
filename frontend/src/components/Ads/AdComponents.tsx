import React from 'react';
import AdBanner from './AdBanner';
import AdFeedNative from './AdFeedNative';
import { useAds } from './AdProvider';

// Composant sidebar pour les profils
export const AdSidebarProfile: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { config } = useAds();

  if (!config.enabled) return null;

  return (
    <div className={`space-y-4 ${className}`}>
      <AdBanner
        slot="sidebar-profile-wide"
        size={[160, 600]}
        format="banner"
        testMode={true}
        className="mx-auto"
        responsive={true}
      />
    </div>
  );
};

// Composant sidebar pour les posts individuels
export const AdSidebarPost: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { config } = useAds();

  if (!config.enabled) return null;

  return (
    <div className={`space-y-4 ${className}`}>
      <AdBanner
        slot="0987654321" // Slot ID à remplacer par votre vrai slot
        size={[300, 250]}
        format="rectangle"
        testMode={true}
        className="mx-auto"
        responsive={true}
      />
    </div>
  );
};

// Composant pour injecter des pubs dans le feed
export const AdFeedInjector: React.FC<{ 
  posts: any[], 
  interval?: number,
  className?: string 
}> = ({ 
  posts, 
  interval = 4, // Une pub tous les 4 posts
  className = '' 
}) => {
  const { config } = useAds();

  if (!config.enabled || !posts || posts.length === 0) {
    return null;
  }

  const postsWithAds: (any | { isAd: true; adIndex: number })[] = [];
  
  posts.forEach((post, index) => {
    postsWithAds.push(post);
    
    // Ajouter une pub tous les X posts (sauf après le dernier)
    if ((index + 1) % interval === 0 && index < posts.length - 1) {
      postsWithAds.push({
        isAd: true,
        adIndex: Math.floor(index / interval)
      });
    }
  });

  return (
    <>
      {postsWithAds.map((item, index) => {
        if ('isAd' in item && item.isAd) {
          return (
            <AdFeedNative
              key={`ad-${item.adIndex}`}
              slot={`feed-${item.adIndex % 3}`} // Rotation de 3 slots différents
              index={item.adIndex}
              className={className}
              title="Contenu sponsorisé"
            />
          );
        }
        
        // Retourner null car le post sera rendu par le composant parent
        return null;
      })}
    </>
  );
};

// Hook pour obtenir les posts avec les publicités injectées
export const usePostsWithAds = (posts: any[], interval: number = 4) => {
  const { config } = useAds();

  if (!config.enabled || !posts || posts.length === 0) {
    return posts;
  }

  const postsWithAds: (any | { isAd: true; adIndex: number })[] = [];
  
  posts.forEach((post, index) => {
    postsWithAds.push(post);
    
    // Ajouter une pub tous les X posts
    if ((index + 1) % interval === 0 && index < posts.length - 1) {
      postsWithAds.push({
        isAd: true,
        adIndex: Math.floor(index / interval),
        id: `ad-${Math.floor(index / interval)}` // ID unique pour React keys
      });
    }
  });

  return postsWithAds;
};
