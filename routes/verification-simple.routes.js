const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verification.controller');

// Version simplifiée des routes pour les tests (sans rate limiting)

/**
 * @route   POST /api/auth/send-verification
 * @desc    Envoyer un email de vérification
 * @access  Public
 */
router.post('/send-verification', verificationController.sendVerificationEmail);

/**
 * @route   GET /api/auth/verify
 * @desc    Vérifier un compte via le token
 * @access  Public
 * @query   token - Le token de vérification
 */
router.get('/verify', verificationController.verifyEmail);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Renvoyer un email de vérification
 * @access  Public
 */
router.post('/resend-verification', verificationController.resendVerificationEmail);

/**
 * @route   GET /api/auth/verification-status
 * @desc    Vérifier le statut de vérification d'un utilisateur
 * @access  Public
 * @query   email - L'email de l'utilisateur
 */
router.get('/verification-status', verificationController.checkVerificationStatus);

module.exports = router;
