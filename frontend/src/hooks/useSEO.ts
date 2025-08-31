import { useEffect, useCallback, useRef } from 'react';
import seoService from '../services/seoService';

interface SEOData {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'profile' | 'article';
  // Nouvelles propriétés pour l'indexation
  username?: string;
  fullName?: string;
  shouldSubmitToGoogle?: boolean;
}

export const useSEO = (data: SEOData) => {
  // Cache pour éviter les soumissions répétées
  const submittedProfiles = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    // Mettre à jour le titre de la page
    document.title = data.title;
    
    // Mettre à jour les métadonnées
    const updateMetaTag = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    const updatePropertyTag = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Métadonnées de base
    updateMetaTag('description', data.description);
    if (data.keywords) {
      updateMetaTag('keywords', data.keywords);
    }

    // Open Graph
    updatePropertyTag('og:title', data.title);
    updatePropertyTag('og:description', data.description);
    updatePropertyTag('og:type', data.type || 'website');
    
    if (data.image) {
      updatePropertyTag('og:image', data.image);
    }
    
    if (data.url) {
      updatePropertyTag('og:url', data.url);
    }

    // Twitter Cards
    updatePropertyTag('twitter:title', data.title);
    updatePropertyTag('twitter:description', data.description);
    updatePropertyTag('twitter:card', 'summary');
    
    if (data.image) {
      updatePropertyTag('twitter:image', data.image);
    }

    // Indexation automatique pour les profils - TEMPORAIREMENT DÉSACTIVÉ POUR DEBUG
    // if (data.type === 'profile' && data.shouldSubmitToGoogle && data.username && data.fullName) {
    //   const profileKey = `${data.username}-${data.fullName}`;
      
    //   // Ne soumettre qu'une seule fois par session pour éviter le spam
    //   if (!submittedProfiles.current.has(profileKey)) {
    //     submittedProfiles.current.add(profileKey);
        
    //     const submitProfile = async () => {
    //       try {
    //         console.log(`🚀 Soumission du profil pour indexation: ${data.fullName} (@${data.username})`);
    //         await seoService.submitUserProfile(data.username!, data.fullName!);
    //       } catch (error) {
    //         console.warn('⚠️ Erreur lors de la soumission SEO:', error);
    //       }
    //     };
    //     submitProfile();
    //   }
    // }
  }, [data.title, data.description, data.keywords, data.image, data.url, data.type, data.username, data.fullName, data.shouldSubmitToGoogle]); // Ajouter les dépendances pour éviter les boucles

  return {};
};

export default useSEO;
