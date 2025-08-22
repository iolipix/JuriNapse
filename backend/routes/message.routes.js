const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Routes pour les messages
router.get('/group/:groupId', authenticateToken, messageController.getMessages);
router.get('/last-messages', authenticateToken, messageController.getLastMessages);
router.post('/', authenticateToken, messageController.createMessage);
router.put('/:id', authenticateToken, messageController.updateMessage);
router.delete('/:id', authenticateToken, messageController.deleteMessage);

// Routes pour les réactions
router.post('/:id/reactions', authenticateToken, messageController.addReaction);
router.delete('/:id/reactions/:emoji', authenticateToken, messageController.removeReaction);

// Routes pour les messages partagés
router.post('/share-post', authenticateToken, messageController.sharePost);
router.post('/share-folder', authenticateToken, messageController.shareFolder);
router.post('/share-pdf', authenticateToken, messageController.sharePdf);

module.exports = router;
