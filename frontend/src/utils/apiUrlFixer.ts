// Utilitaire pour corriger les URLs d'API en production
export const fixApiUrl = (url: string | null): string | null => {
  if (!url) return null;
  
  // Si l'URL pointe vers l'ancien domaine Vercel, la corriger vers Railway
  if (url.includes('juri-napse-bix1.vercel.app') || 
      url.includes('jurinapse.vercel.app') || 
      url.includes('juri-napse.vercel.app')) {
    return url.replace(
      /https:\/\/(juri-napse-bix1|jurinapse|juri-napse)\.vercel\.app\/api/, 
      'https://jurinapse-production.up.railway.app/api'
    );
  }
  
  // Si l'URL commence par /api/, la convertir en URL absolue vers Railway en production
  if (url.startsWith('/api/') && import.meta.env.PROD) {
    return `https://jurinapse-production.up.railway.app${url}`;
  }
  
  return url;
};

// Utilitaire spécifique pour les images de profil
export const fixProfilePictureUrl = (profilePicture: string | null): string | undefined => {
  if (!profilePicture) return undefined;
  
  // Si c'est déjà du base64, pas de changement
  if (profilePicture.startsWith('data:')) {
    return profilePicture;
  }
  
  // Si c'est une URL d'API, la corriger
  const fixed = fixApiUrl(profilePicture);
  return fixed || undefined;
};
