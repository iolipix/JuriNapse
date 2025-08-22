const express = require('express');
const router = express.Router();

// Import des controllers et middleware
const { 
  register, 
  login, 
  logout,
  getProfile, 
  updateProfile, 
  uploadProfilePicture, 
  getProfilePicture, 
  deleteProfilePicture,
  checkUsernameAvailability,
  changePassword
} = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');
const optionalAuthMiddleware = require('../middleware/optionalAuth.middleware');

// Routes d'authentification
router.post('/register', register);
router.post('/login', (req, res, next) => {
  console.log('🚀 DEBUG: Route /api/auth/login appelée avec:', req.body);
  login(req, res, next);
});
router.post('/logout', authMiddleware, logout);
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.put('/change-password', authMiddleware, changePassword);

// Route pour vérifier la disponibilité du username
router.get('/check-username/:username', optionalAuthMiddleware, checkUsernameAvailability);

// Routes pour les photos de profil
router.post('/profile-picture', authMiddleware, uploadProfilePicture);
router.get('/profile-picture/:userId', getProfilePicture);
router.delete('/profile-picture', authMiddleware, deleteProfilePicture);

module.exports = router;
