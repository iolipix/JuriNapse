const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const { repairSubscriptionCounters, quickRepairCounters } = require('../controllers/admin.controller');

// Route pour réparer les compteurs d'abonnements (admin seulement)
router.get('/repair-subscription-counters', authenticateToken, repairSubscriptionCounters);

// Route rapide pour réparer juste les compteurs basiques (emergency)
router.get('/quick-repair-counters', quickRepairCounters);

module.exports = router;
