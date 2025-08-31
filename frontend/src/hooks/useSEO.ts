import { useEffect, useCallback } from 'react';
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

    // Indexation automatique pour les profils (inline pour éviter les dépendances)
    if (data.type === 'profile' && data.shouldSubmitToGoogle && data.username && data.fullName) {
      const submitProfile = async () => {
        try {
          console.log(`🚀 Soumission du profil pour indexation: ${data.fullName} (@${data.username})`);
          await seoService.submitUserProfile(data.username!, data.fullName!);
        } catch (error) {
          console.warn('⚠️ Erreur lors de la soumission SEO:', error);
        }
      };
      submitProfile();
    }
  }); // Pas de dépendances - le useEffect se déclenche à chaque changement de props

  return {};
};

export default useSEO;
