const express = require('express');
const router = express.Router();

// Import des controllers et middleware
const {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  toggleLikePost,
  addComment,
  getTrendingPosts,
  movePostToFolder,
  getUserPosts,
  getPostLikes,
  getComments,
  likeComment,
  unlikeComment,
  updateComment,
  deleteComment,
  savePost,
  unsavePost,
  isPostSaved
} = require('../controllers/post.controller');
const authMiddleware = require('../middleware/auth.middleware');
const optionalAuthMiddleware = require('../middleware/optionalAuth.middleware');

// Routes publiques (accessibles sans authentification, avec auth optionnelle)
router.get('/', optionalAuthMiddleware, getPosts); // Récupérer tous les posts (publics pour les non-connectés)
router.get('/trending', optionalAuthMiddleware, getTrendingPosts); // Posts en tendance

// Routes protégées (nécessitent une authentification)
router.get('/user', authMiddleware, getUserPosts); // Récupérer les posts de l'utilisateur connecté

// Routes publiques avec paramètres (à placer après les routes spécifiques)
router.get('/:id/likes', (req, res, next) => {
  next();
}, optionalAuthMiddleware, getPostLikes); // Récupérer les utilisateurs qui ont liké un post
router.get('/:id/comments', optionalAuthMiddleware, getComments); // Récupérer les commentaires d'un post avec pagination
// Routes de commentaires spécifiques - DOIVENT être avant /:id
router.put('/:id/comments/:commentId', authMiddleware, updateComment); // Modifier un commentaire
router.delete('/:id/comments/:commentId', authMiddleware, deleteComment); // Supprimer un commentaire
router.post('/:id/comments/:commentId/like', authMiddleware, likeComment); // Liker un commentaire
router.delete('/:id/comments/:commentId/like', authMiddleware, unlikeComment); // Déliker un commentaire
router.post('/:id/comments', authMiddleware, addComment); // Ajouter un commentaire
// Route générique /:id DOIT être après les routes spécifiques
router.get('/:id', optionalAuthMiddleware, getPostById); // Récupérer un post par ID
router.post('/', authMiddleware, createPost); // Créer un post
router.put('/:id', authMiddleware, updatePost); // Mettre à jour un post
router.put('/:id/move-to-folder', authMiddleware, movePostToFolder); // Déplacer un post vers un dossier
router.delete('/:id', authMiddleware, deletePost); // Supprimer un post
router.post('/:id/like', authMiddleware, toggleLikePost); // Liker/Disliker un post
router.get('/:id/saved', authMiddleware, isPostSaved); // Vérifier si un post est sauvegardé
router.post('/:id/save', authMiddleware, savePost); // Sauvegarder un post
router.delete('/:id/save', authMiddleware, unsavePost); // Désauvegarder un post

module.exports = router;
