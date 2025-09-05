export type UserRole = 'user' | 'moderator' | 'administrator' | 'premium';

export const USER_ROLES: Record<UserRole, { label: string; level: number; color: string; description: string }> = {
  user: {
    label: 'Utilisateur',
    level: 1,
    color: 'text-gray-600',
    description: 'Utilisateur standard avec accès aux fonctionnalités de base'
  },
  premium: {
    label: 'Premium',
    level: 1,
    color: 'text-yellow-600',
    description: 'Utilisateur premium avec des fonctionnalités avancées'
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

// Interface pour les utilisateurs avec rôle cumulatif
interface UserWithRoles {
  role?: string; // Format: "user;premium;moderator;administrator"
}

/**
 * Parse le champ role pour extraire les rôles individuels
 */
export const parseRoles = (roleString?: string): UserRole[] => {
  if (!roleString) return [];
  return roleString.split(';').map(r => r.trim() as UserRole).filter(Boolean);
};

/**
 * Vérifie si un utilisateur a un rôle spécifique (système de rôle cumulatif)
 */
export const hasRole = (user: UserWithRoles | undefined, role: UserRole): boolean => {
  if (!user) return false;
  
  // Système actuel: parser le champ role
  const userRoles = parseRoles(user.role);
  return userRoles.includes(role);
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
 * Obtient le niveau de rôle le plus élevé d'un utilisateur
 */
export const getHighestRoleLevel = (user: UserWithRoles | undefined): number => {
  if (!user) return 0;
  
  let maxLevel = 0;
  
  // Parser le champ role et trouver le niveau maximum
  const userRoles = parseRoles(user.role);
  for (const role of userRoles) {
    const level = USER_ROLES[role]?.level || 0;
    maxLevel = Math.max(maxLevel, level);
  }
  
  return maxLevel;
};

/**
 * Vérifie si un utilisateur a au moins le niveau de rôle spécifié (avec rôles multiples)
 */
export const hasRoleLevelMultiple = (user: UserWithRoles | undefined, requiredRole: UserRole): boolean => {
  const userLevel = getHighestRoleLevel(user);
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
 * Vérifie si un utilisateur est modérateur ou plus (système de rôles multiples)
 */
export const isModeratorMultiple = (user: UserWithRoles | undefined): boolean => {
  // Vérifier uniquement si l'utilisateur a explicitement le rôle de modérateur
  // Ne pas afficher l'onglet modérateur aux admins qui n'ont pas le rôle modérateur
  return hasRole(user, 'moderator');
};

/**
 * Vérifie si un utilisateur est administrateur
 */
export const isAdministrator = (userRole: UserRole | undefined): boolean => {
  return hasRoleLevel(userRole, 'administrator');
};

/**
 * Vérifie si un utilisateur est administrateur (système de rôles multiples)
 */
export const isAdministratorMultiple = (user: UserWithRoles | undefined): boolean => {
  return hasRole(user, 'administrator');
};

/**
 * Vérifie si un utilisateur est premium
 */
export const isPremium = (user: UserWithRoles | undefined): boolean => {
  return hasRole(user, 'premium');
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
