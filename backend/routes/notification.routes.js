const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Routes pour les notifications
router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.put('/:id/read', notificationController.markAsRead);
router.put('/read-all', notificationController.markAllAsRead);
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
