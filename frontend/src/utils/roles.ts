export type UserRole = 'user' | 'moderator' | 'administrator';

export const USER_ROLES: Record<UserRole, { label: string; level: number; color: string; description: string }> = {
  user: {
    label: 'Utilisateur',
    level: 1,
    color: 'text-gray-600',
    description: 'Utilisateur standard avec accès aux fonctionnalités de base'
  },
  moderator: {
    label: 'Modérateur',
    level: 2,
    color: 'text-blue-600',
    description: 'Peut modérer le contenu et gérer les utilisateurs'
  },
  administrator: {
    label: 'Administrateur',
    level: 3,
    color: 'text-red-600',
    description: 'Accès complet à toutes les fonctionnalités d\'administration'
  }
};

/**
 * Vérifie si un utilisateur a au moins le niveau de rôle spécifié
 */
export const hasRoleLevel = (userRole: UserRole | undefined, requiredRole: UserRole): boolean => {
  if (!userRole) return false;
  
  const userLevel = USER_ROLES[userRole]?.level || 0;
  const requiredLevel = USER_ROLES[requiredRole]?.level || 0;
  
  return userLevel >= requiredLevel;
};

/**
 * Vérifie si un utilisateur est modérateur ou plus
 */
export const isModerator = (userRole: UserRole | undefined): boolean => {
  return hasRoleLevel(userRole, 'moderator');
};

/**
 * Vérifie si un utilisateur est administrateur
 */
export const isAdministrator = (userRole: UserRole | undefined): boolean => {
  return hasRoleLevel(userRole, 'administrator');
};

/**
 * Obtient le badge de rôle pour l'affichage
 */
export const getRoleBadge = (role: UserRole | undefined): { label: string; color: string } | null => {
  if (!role || role === 'user') return null;
  
  const roleInfo = USER_ROLES[role];
  return {
    label: roleInfo.label,
    color: roleInfo.color
  };
};

/**
 * Obtient tous les rôles disponibles (utile pour les formulaires d'admin)
 */
export const getAllRoles = (): Array<{ value: UserRole; label: string; description: string }> => {
  return Object.entries(USER_ROLES).map(([value, info]) => ({
    value: value as UserRole,
    label: info.label,
    description: info.description
  }));
};
