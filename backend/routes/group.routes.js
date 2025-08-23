const express = require('express');
const router = express.Router();
const groupController = require('../controllers/group.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Routes pour les groupes
router.get('/', authenticateToken, groupController.getAllGroups);
router.post('/', authenticateToken, groupController.createGroup);
router.get('/:id', authenticateToken, groupController.getGroup);
router.put('/:id', authenticateToken, groupController.updateGroup);
router.delete('/:id', authenticateToken, groupController.deleteGroup);

// Routes pour les membres
router.post('/:id/members', authenticateToken, groupController.addMember);
router.delete('/:id/members/:userId', authenticateToken, groupController.removeMember);
router.post('/:id/leave', authenticateToken, groupController.leaveGroup);

// Routes pour les notifications
router.post('/:id/notifications', authenticateToken, groupController.toggleNotifications);

// Routes pour masquer/afficher
router.post('/:id/hide', authenticateToken, groupController.hideGroup);
router.post('/:id/show', authenticateToken, groupController.showGroup);
router.post('/:id/delete-history', authenticateToken, groupController.deleteHistory);

// Routes pour la modération
router.post('/:id/moderators', authenticateToken, (req, res, next) => {
  next();
}, groupController.promoteModerator);
router.delete('/:id/moderators', authenticateToken, groupController.demoteModerator);
router.post('/:id/kick', authenticateToken, groupController.kickMember);
// Route pour récupérer l'image du groupe (renvoie l'image binaire)
router.get('/:id/picture', authenticateToken, groupController.getGroupPicture);
router.put('/:id/picture', authenticateToken, groupController.updateGroupPicture);

module.exports = router;
