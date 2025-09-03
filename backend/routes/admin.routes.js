const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const { requireModerator, requireAdmin } = require('../middleware/roleAuth');
const { 
  repairSubscriptionCounters, 
  quickRepairCounters,
  getAllUsers,
  updateUserRole,
  getRoleStats,
  toggleUserActive
} = require('../controllers/admin.controller');

// Route pour réparer les compteurs d'abonnements (admin seulement)
router.get('/repair-subscription-counters', authenticateToken, repairSubscriptionCounters);

// Route rapide pour réparer juste les compteurs basiques (emergency)
router.get('/quick-repair-counters', quickRepairCounters);

// === Routes de gestion des utilisateurs ===
// Obtenir tous les utilisateurs (modérateur/admin)
router.get('/users', authenticateToken, requireModerator, getAllUsers);

// Obtenir les statistiques des rôles (admin uniquement)
router.get('/role-stats', authenticateToken, requireAdmin, getRoleStats);

// Mettre à jour le rôle d'un utilisateur (admin uniquement)
router.put('/users/:userId/role', authenticateToken, requireAdmin, updateUserRole);

// Activer/désactiver un utilisateur (modérateur/admin)
router.put('/users/:userId/toggle-active', authenticateToken, requireModerator, toggleUserActive);

module.exports = router;
