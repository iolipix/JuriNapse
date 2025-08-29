const express = require('express');
const router = express.Router();
const groupController = require('../controllers/group.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Routes pour les groupes
router.get('/', authMiddleware, groupController.getAllGroups);
router.post('/', authMiddleware, groupController.createGroup);
router.get('/:id', authMiddleware, groupController.getGroup);
router.put('/:id', authMiddleware, groupController.updateGroup);
router.delete('/:id', authMiddleware, groupController.deleteGroup);

// Routes pour les membres
router.post('/:id/members', authMiddleware, groupController.addMember);
router.delete('/:id/members/:userId', authMiddleware, groupController.removeMember);
router.post('/:id/leave', authMiddleware, groupController.leaveGroup);

// Routes pour les notifications
router.post('/:id/notifications', authMiddleware, groupController.toggleNotifications);

// Routes pour masquer/afficher
router.post('/:id/hide', authMiddleware, groupController.hideGroup);
router.post('/:id/show', authMiddleware, groupController.showGroup);
router.post('/:id/delete-history', authMiddleware, groupController.deleteHistory);

// Routes pour la modération
router.post('/:id/moderators', authMiddleware, (req, res, next) => {
  next();
}, groupController.promoteModerator);
router.delete('/:id/moderators', authMiddleware, groupController.demoteModerator);
router.post('/:id/kick', authMiddleware, groupController.kickMember);
router.put('/:id/picture', authMiddleware, groupController.updateGroupPicture);

module.exports = router;
