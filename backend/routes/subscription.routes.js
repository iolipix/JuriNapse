const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const { authenticateToken, optionalAuthenticateToken } = require('../middleware/auth.middleware');

// Routes pour les abonnements
router.get('/', authenticateToken, subscriptionController.getUserSubscriptions);
router.post('/follow/:userId', authenticateToken, subscriptionController.followUser);
router.delete('/unfollow/:userId', authenticateToken, subscriptionController.unfollowUser);
router.get('/followers', authenticateToken, subscriptionController.getFollowers);
router.get('/following', authenticateToken, subscriptionController.getFollowing);
router.get('/is-following/:userId', authenticateToken, subscriptionController.isFollowing);

// Routes pour les abonnés/abonnements d'un utilisateur spécifique
router.get('/user/:userId/followers', optionalAuthenticateToken, subscriptionController.getUserFollowers);
router.get('/user/:userId/following', optionalAuthenticateToken, subscriptionController.getUserFollowing);

// Routes pour les utilisateurs bloqués
router.get('/blocked', authenticateToken, subscriptionController.getBlockedUsers);
router.post('/block/:userId', authenticateToken, subscriptionController.blockUser);
router.delete('/unblock/:userId', authenticateToken, subscriptionController.unblockUser);
router.get('/is-blocked/:userId', authenticateToken, subscriptionController.isBlocked);

module.exports = router;
