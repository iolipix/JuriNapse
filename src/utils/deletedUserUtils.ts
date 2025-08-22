/**
 * Utilitaires frontend pour gérer les utilisateurs supprimés
 */

export const DELETED_USER_DISPLAY = {
  username: 'Utilisateur introuvable',
  firstName: '',
  lastName: '',
  profilePicture: null,
  university: '',
  bio: '',
  isStudent: false,
  location: '',
  website: '',
  isVerified: false,
  isActive: false
};

/**
 * Vérifie si un utilisateur est supprimé/introuvable
 * @param {Object} user - L'objet utilisateur
 * @returns {boolean} - true si l'utilisateur est introuvable
 */
export function isUserDeleted(user: any): boolean {
  if (!user) return true;
  
  return (
    user.username === 'Utilisateur introuvable' ||
    user.username === 'Utilisateur supprimé' ||
    user.isDeleted === true
  );
}

/**
 * Retourne le nom d'affichage pour un utilisateur
 * @param {Object} user - L'objet utilisateur
 * @returns {string} - Le nom à afficher
 */
export function getDisplayName(user: any): string {
  if (isUserDeleted(user)) {
    return 'Utilisateur introuvable';
  }
  
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`.trim();
  }
  
  return user.username || 'Utilisateur';
}

/**
 * Retourne le username d'affichage pour un utilisateur
 * @param {Object} user - L'objet utilisateur
 * @returns {string} - Le username à afficher
 */
export function getDisplayUsername(user: any): string {
  if (isUserDeleted(user)) {
    return 'Utilisateur introuvable';
  }
  
  return user.username || 'Utilisateur';
}

/**
 * Retourne la photo de profil d'affichage pour un utilisateur
 * @param {Object} user - L'objet utilisateur
 * @returns {string|null} - L'URL de la photo ou null
 */
export function getDisplayProfilePicture(user: any): string | null {
  if (isUserDeleted(user)) {
    return null;
  }
  
  return user.profilePicture || null;
}

/**
 * Vérifie si on peut cliquer sur le profil d'un utilisateur
 * @param {Object} user - L'objet utilisateur
 * @returns {boolean} - true si le profil est cliquable
 */
export function isProfileClickable(user: any): boolean {
  return !isUserDeleted(user) && user.id && user.id !== 'unknown';
}

/**
 * Gère le clic sur un profil utilisateur
 * @param {Object} user - L'objet utilisateur
 * @param {Function} onViewUserProfile - Fonction callback pour voir le profil
 * @param {Function} onShowUserNotFound - Fonction callback pour afficher "utilisateur introuvable"
 */
export function handleProfileClick(
  user: any, 
  onViewUserProfile?: (userId: string) => void,
  onShowUserNotFound?: () => void
): void {
  if (isUserDeleted(user)) {
    if (onShowUserNotFound) {
      onShowUserNotFound();
    }
    return;
  }
  
  if (user.id && onViewUserProfile) {
    onViewUserProfile(user.id);
  }
}

/**
 * Retourne les initiales d'un utilisateur pour l'avatar
 * @param {Object} user - L'objet utilisateur
 * @returns {string} - Les initiales
 */
export function getDisplayInitials(user: any): string {
  if (isUserDeleted(user)) {
    return '?';
  }
  
  if (user.firstName && user.lastName) {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }
  
  if (user.username) {
    return user.username.charAt(0).toUpperCase();
  }
  
  return 'U';
}

/**
 * Retourne les informations d'affichage complètes d'un utilisateur
 * @param {Object} user - L'objet utilisateur
 * @returns {Object} - Les informations d'affichage
 */
export function getUserDisplayInfo(user: any) {
  if (isUserDeleted(user)) {
    return {
      ...DELETED_USER_DISPLAY,
      id: user?.id || 'unknown',
      initials: '?',
      isDeleted: true,
      isClickable: false
    };
  }
  
  return {
    ...user,
    displayName: getDisplayName(user),
    displayUsername: getDisplayUsername(user),
    displayProfilePicture: getDisplayProfilePicture(user),
    initials: getDisplayInitials(user),
    isDeleted: false,
    isClickable: isProfileClickable(user)
  };
}
