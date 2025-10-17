const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  enrichDecisionFromJudilibre,
  suggestDecisions,
  downloadDecisionFile
} = require('../controllers/judilibre.controller');

// Enrichir une décision via Judilibre
router.post('/enrich', authenticateToken, enrichDecisionFromJudilibre);

// Suggestions de décisions (autocomplétion)
router.get('/suggest', authenticateToken, suggestDecisions);

// Télécharger un fichier de décision
router.get('/download/:fileName', authenticateToken, downloadDecisionFile);

module.exports = router;