const express = require('express');
const router = express.Router();
const { prerenderProfile } = require('../controllers/prerender.controller');

// Route de prérendu pour les profils (pour les bots SEO)
router.get('/profile/:username', prerenderProfile);

module.exports = router;
