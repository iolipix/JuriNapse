const express = require('express');
const { getUsers, getUserById, getUserByUsername, getSavedPosts, getRecentEmojis, updateRecentEmojis, getUserStats, deleteUser, getNotificationSettings, updateNotificationSettings } = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// GET /api/users - Récupérer tous les utilisateurs (pour les suggestions)
router.get('/', authMiddleware, getUsers);

// GET /api/users/saved-posts - Récupérer les posts sauvegardés de l'utilisateur connecté
router.get('/saved-posts', authMiddleware, getSavedPosts);

// GET /api/users/recent-emojis - Récupérer les emojis récents
router.get('/recent-emojis', authMiddleware, getRecentEmojis);

// POST /api/users/recent-emojis - Mettre à jour les emojis récents
router.post('/recent-emojis', authMiddleware, updateRecentEmojis);

// GET /api/users/notification-settings - Récupérer les paramètres de notifications
router.get('/notification-settings', authMiddleware, getNotificationSettings);

// PUT /api/users/notification-settings - Mettre à jour les paramètres de notifications
router.put('/notification-settings', authMiddleware, updateNotificationSettings);

// GET /api/users/username/:username - Récupérer un utilisateur par son username
router.get('/username/:username', getUserByUsername);

// GET /api/users/:id/stats - Récupérer les statistiques d'un utilisateur
router.get('/:id/stats', authMiddleware, getUserStats);

// GET /api/users/:id - Récupérer un utilisateur spécifique
router.get('/:id', authMiddleware, getUserById);

// DELETE /api/users/delete-account - Supprimer le compte utilisateur (suppression douce)
router.delete('/delete-account', authMiddleware, deleteUser);

module.exports = router;
