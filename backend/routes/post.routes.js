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
  getUserPostsByUsername,
  getUserStatsByUsername,
  getPostLikes,
  getComments,
  likeComment,
  unlikeComment,
  updateComment,
  deleteComment,
  savePost,
  unsavePost,
  isPostSaved,
  searchPosts
} = require('../controllers/post.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const optionalAuthMiddleware = require('../middleware/optionalAuth.middleware');

// Routes publiques (accessibles sans authentification, avec auth optionnelle)
router.get('/search', optionalAuthMiddleware, searchPosts); // Recherche de posts
router.get('/', optionalAuthMiddleware, getPosts); // Récupérer tous les posts (publics pour les non-connectés)
router.get('/trending', optionalAuthMiddleware, getTrendingPosts); // Posts en tendance

// Routes protégées (nécessitent une authentification)
router.get('/user', authenticateToken, getUserPosts); // Récupérer les posts de l'utilisateur connecté
router.get('/user/:username', optionalAuthMiddleware, getUserPostsByUsername); // Récupérer les posts d'un utilisateur par username
router.get('/user/:username/stats', optionalAuthMiddleware, getUserStatsByUsername); // Récupérer les statistiques d'un utilisateur

// Routes publiques avec paramètres (à placer après les routes spécifiques)
router.get('/:id/likes', (req, res, next) => {
  next();
}, optionalAuthMiddleware, getPostLikes); // Récupérer les utilisateurs qui ont liké un post
router.get('/:id/comments', optionalAuthMiddleware, getComments); // Récupérer les commentaires d'un post avec pagination
// Routes de commentaires spécifiques - DOIVENT être avant /:id
router.put('/:id/comments/:commentId', authenticateToken, updateComment); // Modifier un commentaire
router.delete('/:id/comments/:commentId', authenticateToken, deleteComment); // Supprimer un commentaire
router.post('/:id/comments/:commentId/like', authenticateToken, likeComment); // Liker un commentaire
router.delete('/:id/comments/:commentId/like', authenticateToken, unlikeComment); // Déliker un commentaire
router.post('/:id/comments', authenticateToken, addComment); // Ajouter un commentaire
// Route générique /:id DOIT être après les routes spécifiques
router.get('/:id', optionalAuthMiddleware, getPostById); // Récupérer un post par ID
router.post('/', authenticateToken, createPost); // Créer un post
router.put('/:id', authenticateToken, updatePost); // Mettre à jour un post
router.put('/:id/move-to-folder', authenticateToken, movePostToFolder); // Déplacer un post vers un dossier
router.delete('/:id', authenticateToken, deletePost); // Supprimer un post
router.post('/:id/like', authenticateToken, toggleLikePost); // Liker/Disliker un post
router.get('/:id/saved', authenticateToken, isPostSaved); // Vérifier si un post est sauvegardé
router.post('/:id/save', authenticateToken, savePost); // Sauvegarder un post
router.delete('/:id/save', authenticateToken, unsavePost); // Désauvegarder un post

module.exports = router;
