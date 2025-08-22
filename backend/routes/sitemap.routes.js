const express = require('express');
const { generateSitemap } = require('../controllers/sitemap.controller');

const router = express.Router();

// Route pour le sitemap XML
router.get('/sitemap.xml', generateSitemap);

module.exports = router;
