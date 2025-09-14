const express = require('express');
const { getUsers, getUserById, getUserByUsername, getSavedPosts, getRecentEmojis, updateRecentEmojis, getUserStats, deleteUser, getNotificationSettings, updateNotificationSettings, searchUsers } = require('../controllers/user.controller');
const { authenticateToken, optionalAuthenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

// GET /api/users/search - Rechercher des utilisateurs (authentification optionnelle)
router.get('/search', optionalAuthenticateToken, searchUsers);

// GET /api/users - Récupérer tous les utilisateurs (pour les suggestions)
router.get('/', authenticateToken, getUsers);

// GET /api/users/saved-posts - Récupérer les posts sauvegardés de l'utilisateur connecté
router.get('/saved-posts', authenticateToken, getSavedPosts);

// GET /api/users/recent-emojis - Récupérer les emojis récents
router.get('/recent-emojis', authenticateToken, getRecentEmojis);

// POST /api/users/recent-emojis - Mettre à jour les emojis récents
router.post('/recent-emojis', authenticateToken, updateRecentEmojis);

// GET /api/users/notification-settings - Récupérer les paramètres de notifications
router.get('/notification-settings', authenticateToken, getNotificationSettings);

// PUT /api/users/notification-settings - Mettre à jour les paramètres de notifications
router.put('/notification-settings', authenticateToken, updateNotificationSettings);

// GET /api/users/premium-info - Récupérer les informations premium de l'utilisateur connecté
router.get('/premium-info', authenticateToken, async (req, res) => {
  try {
    const User = require('../models/user.model');
    const user = await User.findById(req.user.id)
      .populate('premiumGrantedBy', 'username firstName lastName')
      .populate('premiumHistory.grantedBy', 'username firstName lastName')
      .populate('premiumHistory.revokedBy', 'username firstName lastName');

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Utiliser la nouvelle méthode getPremiumInfo qui gère l'historique
    const premiumInfo = user.getPremiumInfo();
    
    // Enrichir les informations du grantedBy pour compatibilité
    if (premiumInfo.grantedBy) {
      const grantedByUser = await User.findById(premiumInfo.grantedBy)
        .select('username firstName lastName');
      
      if (grantedByUser) {
        premiumInfo.grantedBy = {
          username: grantedByUser.username,
          fullName: `${grantedByUser.firstName} ${grantedByUser.lastName}`
        };
      }
    }
    
    // Enrichir l'historique avec les noms d'utilisateurs
    if (premiumInfo.history && premiumInfo.history.length > 0) {
      for (let entry of premiumInfo.history) {
        if (entry.grantedBy) {
          const grantedByUser = await User.findById(entry.grantedBy)
            .select('username firstName lastName');
          if (grantedByUser) {
            entry.grantedByInfo = {
              username: grantedByUser.username,
              fullName: `${grantedByUser.firstName} ${grantedByUser.lastName}`
            };
          }
        }
        
        if (entry.revokedBy) {
          const revokedByUser = await User.findById(entry.revokedBy)
            .select('username firstName lastName');
          if (revokedByUser) {
            entry.revokedByInfo = {
              username: revokedByUser.username,
              fullName: `${revokedByUser.firstName} ${revokedByUser.lastName}`
            };
          }
        }
      }
    }

    res.json({
      ...premiumInfo,
      role: user.role
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des infos premium:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/users/username/:username - Récupérer un utilisateur par son username
router.get('/username/:username', getUserByUsername);

// GET /api/users/:id/stats - Récupérer les statistiques d'un utilisateur
router.get('/:id/stats', optionalAuthenticateToken, getUserStats);

// GET /api/users/:id - Récupérer un utilisateur spécifique
router.get('/:id', authenticateToken, getUserById);

// DELETE /api/users/delete-account - Supprimer le compte utilisateur (suppression douce)
router.delete('/delete-account', authenticateToken, deleteUser);

module.exports = router;
