/**
 * Middleware pour vérifier les rôles utilisateur
 */

const USER_ROLES = {
  user: { level: 1 },
  moderator: { level: 2 },
  administrator: { level: 3 }
};

/**
 * Vérifie si un utilisateur a au moins le niveau de rôle requis
 */
const hasRoleLevel = (userRole, requiredRole) => {
  const userLevel = USER_ROLES[userRole]?.level || 0;
  const requiredLevel = USER_ROLES[requiredRole]?.level || 0;
  return userLevel >= requiredLevel;
};

/**
 * Middleware pour vérifier si l'utilisateur a le rôle requis
 */
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    try {
      // Vérifier si l'utilisateur est authentifié
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Accès non autorisé'
        });
      }

      const userRole = req.user.role || 'user';

      // Vérifier si l'utilisateur a le niveau requis
      if (!hasRoleLevel(userRole, requiredRole)) {
        return res.status(403).json({
          success: false,
          message: `Accès refusé. Rôle ${requiredRole} ou supérieur requis.`
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification des permissions'
      });
    }
  };
};

/**
 * Middleware pour les modérateurs et administrateurs
 */
const requireModerator = requireRole('moderator');

/**
 * Middleware pour les administrateurs uniquement
 */
const requireAdmin = requireRole('administrator');

/**
 * Middleware pour vérifier si l'utilisateur peut modifier un autre utilisateur
 */
const canModifyUser = (req, res, next) => {
  try {
    const currentUserRole = req.user?.role || 'user';
    const targetUserId = req.params.id || req.params.userId;
    const currentUserId = req.user?.id;

    // L'utilisateur peut toujours modifier ses propres données
    if (currentUserId === targetUserId) {
      return next();
    }

    // Seuls les modérateurs et administrateurs peuvent modifier d'autres utilisateurs
    if (!hasRoleLevel(currentUserRole, 'moderator')) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez pas modifier les données d\'autres utilisateurs'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification des permissions'
    });
  }
};

module.exports = {
  requireRole,
  requireModerator,
  requireAdmin,
  canModifyUser,
  hasRoleLevel
};
