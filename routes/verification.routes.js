const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verification.controller');
const rateLimit = require('express-rate-limit');

// Rate limiting pour les emails de vérification (max 3 par heure par IP)
const emailRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 3, // 3 tentatives par heure
  message: {
    success: false,
    message: 'Trop de tentatives d\'envoi d\'email. Réessayez dans 1 heure.'
  },
  standardHeaders: true,
  legacyHeaders: false
  // Utilisation du keyGenerator par défaut (IP) plutôt que personnalisé
});

// Rate limiting pour la vérification des tokens (plus permissif)
const verifyRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 tentatives par 15 minutes
  message: 'Trop de tentatives de vérification. Réessayez dans 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * @route   POST /api/auth/send-verification
 * @desc    Envoyer un email de vérification
 * @access  Public
 */
router.post('/send-verification', emailRateLimit, verificationController.sendVerificationEmail);

/**
 * @route   GET /api/auth/verify
 * @desc    Vérifier un compte via le token
 * @access  Public
 * @query   token - Le token de vérification
 */
router.get('/verify', verifyRateLimit, verificationController.verifyEmail);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Renvoyer un email de vérification
 * @access  Public
 */
router.post('/resend-verification', emailRateLimit, verificationController.resendVerificationEmail);

/**
 * @route   GET /api/auth/verification-status
 * @desc    Vérifier le statut de vérification d'un utilisateur
 * @access  Public
 * @query   email - L'email de l'utilisateur
 */
router.get('/verification-status', verificationController.checkVerificationStatus);

/**
 * @route   GET /api/auth/token-stats
 * @desc    Statistiques des tokens (admin uniquement)
 * @access  Admin
 */
router.get('/token-stats', verificationController.getTokenStats);

module.exports = router;
