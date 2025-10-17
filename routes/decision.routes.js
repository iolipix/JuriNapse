const express = require('express');
const router = express.Router();
const { authenticateToken, optionalAuth } = require('../middleware/auth.middleware');
const {
  getDecisionByNumber,
  getDecisions,
  searchDecisions,
  forceImportDecision,
  getDecisionStats
} = require('../controllers/decision.controller');

// Routes publiques (avec auth optionnelle)
router.get('/search', optionalAuth, searchDecisions); // Autocomplétion
router.get('/stats', getDecisionStats); // Statistiques
router.get('/list', getDecisions); // Liste paginée
router.get('/:decisionNumber', optionalAuth, getDecisionByNumber); // Récupération avec auto-import

// Routes protégées
router.post('/import', authenticateToken, forceImportDecision); // Import forcé

module.exports = router;