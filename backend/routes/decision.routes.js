const express = require('express');
const router = express.Router();
const { authenticateToken, optionalAuthenticateToken } = require('../middleware/auth.middleware');
const {
  getDecisionByNumber,
  getDecisions,
  searchDecisions,
  forceImportDecision,
  getDecisionStats
} = require('../controllers/decision.controller');

// Routes publiques (avec auth optionnelle)
router.get('/search', optionalAuthenticateToken, searchDecisions); // Autocomplétion
router.get('/stats', getDecisionStats); // Statistiques
router.get('/list', getDecisions); // Liste paginée
router.get('/:decisionNumber', optionalAuthenticateToken, getDecisionByNumber); // Récupération avec auto-import

// Routes protégées
router.post('/import', authenticateToken, forceImportDecision); // Import forcé

module.exports = router;