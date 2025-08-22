const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Routes pour les messages
router.get('/group/:groupId', authMiddleware, messageController.getMessages);
router.get('/last-messages', authMiddleware, messageController.getLastMessages);
router.post('/', authMiddleware, messageController.createMessage);
router.put('/:id', authMiddleware, messageController.updateMessage);
router.delete('/:id', authMiddleware, messageController.deleteMessage);

// Routes pour les réactions
router.post('/:id/reactions', authMiddleware, messageController.addReaction);
router.delete('/:id/reactions/:emoji', authMiddleware, messageController.removeReaction);

// Routes pour les messages partagés
router.post('/share-post', authMiddleware, messageController.sharePost);
router.post('/share-folder', authMiddleware, messageController.shareFolder);
router.post('/share-pdf', authMiddleware, messageController.sharePdf);

module.exports = router;
