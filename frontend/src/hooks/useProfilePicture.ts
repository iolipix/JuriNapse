import { fixProfilePictureUrl } from '../utils/apiUrlFixer';

export const useProfilePicture = (profilePicture: string | null | undefined): string | null => {
  if (!profilePicture) return null;
  
  const fixedUrl = fixProfilePictureUrl(profilePicture);
  if (!fixedUrl) return null;
  
  // Si c'est une URL d'API, l'utiliser directement avec cache-busting
  if (fixedUrl.startsWith('/api/') || fixedUrl.startsWith('http')) {
    const separator = fixedUrl.includes('?') ? '&' : '?';
    return `${fixedUrl}${separator}t=${Date.now()}`;
  }
  
  // Si c'est déjà du base64 complet, l'utiliser directement
  if (fixedUrl.startsWith('data:')) {
    return fixedUrl;
  }
  
  // Sinon, ajouter le préfixe base64
  return `data:image/jpeg;base64,${fixedUrl}`;
};
