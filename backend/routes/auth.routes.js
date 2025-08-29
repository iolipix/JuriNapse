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
  changePassword,
  sendEmailVerification,
  verifyEmail
} = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const optionalAuthMiddleware = require('../middleware/optionalAuth.middleware');

// Routes d'authentification
router.post('/register', register);
router.post('/login', (req, res, next) => {
  console.log('🚀 DEBUG: Route /api/auth/login appelée avec:', req.body);
  login(req, res, next);
});
router.post('/logout', authenticateToken, logout);
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.put('/change-password', authenticateToken, changePassword);

// Route pour vérifier la disponibilité du username
router.get('/check-username/:username', optionalAuthMiddleware, checkUsernameAvailability);

// Routes pour les photos de profil
router.post('/profile-picture', authenticateToken, uploadProfilePicture);
router.get('/profile-picture/:userId', getProfilePicture);
router.delete('/profile-picture', authenticateToken, deleteProfilePicture);

// Routes pour la vérification d'email
router.post('/send-email-verification', sendEmailVerification);
router.post('/verify-email', verifyEmail);

module.exports = router;
