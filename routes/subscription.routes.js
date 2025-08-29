const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Routes pour les abonnements
router.get('/', authMiddleware, subscriptionController.getUserSubscriptions);
router.post('/follow/:userId', authMiddleware, subscriptionController.followUser);
router.delete('/unfollow/:userId', authMiddleware, subscriptionController.unfollowUser);
router.get('/followers', authMiddleware, subscriptionController.getFollowers);
router.get('/following', authMiddleware, subscriptionController.getFollowing);
router.get('/is-following/:userId', authMiddleware, subscriptionController.isFollowing);

// Routes pour les abonnés/abonnements d'un utilisateur spécifique
router.get('/user/:userId/followers', authMiddleware, subscriptionController.getUserFollowers);
router.get('/user/:userId/following', authMiddleware, subscriptionController.getUserFollowing);

// Routes pour les utilisateurs bloqués
router.get('/blocked', authMiddleware, subscriptionController.getBlockedUsers);
router.post('/block/:userId', authMiddleware, subscriptionController.blockUser);
router.delete('/unblock/:userId', authMiddleware, subscriptionController.unblockUser);
router.get('/is-blocked/:userId', authMiddleware, subscriptionController.isBlocked);

module.exports = router;
