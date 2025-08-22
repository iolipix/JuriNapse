const express = require('express');
const router = express.Router();
const folderController = require('../controllers/folder.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// Routes pour les dossiers
router.post('/', folderController.createFolder);
router.get('/', folderController.getFolders);
router.get('/search', folderController.searchFolders);
router.get('/:id', folderController.getFolder);
router.put('/:id', folderController.updateFolder);
router.delete('/:id', folderController.deleteFolder);

// Routes pour les collaborateurs
router.post('/:id/collaborators', folderController.addCollaborator);
router.delete('/:id/collaborators/:userId', folderController.removeCollaborator);

module.exports = router;
