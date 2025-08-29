const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const Post = require('../models/post.model');

// Route pour générer un sitemap XML dynamique avec tous les profils
router.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    // Récupérer tous les utilisateurs actifs
    const users = await User.find({ isActive: true }).select('username updatedAt');
    
    // Récupérer tous les posts
    const posts = await Post.find().select('id updatedAt');
    
    // Générer le XML du sitemap
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/feed</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/trending</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.8</priority>
  </url>`;

    // Ajouter les profils utilisateur avec priorités optimisées
    const featuredUsers = ['theophane-maurey', 'theophane.maurey']; // Profils prioritaires
    
    users.forEach(user => {
      if (user.username) {
        // Priorité plus élevée pour les profils vedettes
        const priority = featuredUsers.includes(user.username.toLowerCase()) ? '0.9' : '0.7';
        const changefreq = featuredUsers.includes(user.username.toLowerCase()) ? 'daily' : 'weekly';
        
        sitemap += `
  <url>
    <loc>${baseUrl}/profile/${user.username}</loc>
    <lastmod>${user.updatedAt ? user.updatedAt.toISOString() : new Date().toISOString()}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
      }
    });

    // Ajouter les posts
    posts.forEach(post => {
      if (post.id) {
        sitemap += `
  <url>
    <loc>${baseUrl}/post/${post.id}</loc>
    <lastmod>${post.updatedAt ? post.updatedAt.toISOString() : new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
      }
    });

    sitemap += `
</urlset>`;

    res.set('Content-Type', 'application/xml');
    res.set('Cache-Control', 'public, max-age=3600'); // Cache 1 heure
    res.send(sitemap);
    
  } catch (error) {
    res.status(500).send('Error generating sitemap');
  }
});

// Route pour robots.txt optimisé
router.get('/robots.txt', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  
  const robotsTxt = `User-agent: *
Allow: /
Allow: /feed
Allow: /trending
Allow: /profile/*
Allow: /post/*
Allow: /folder/*
Disallow: /admin
Disallow: /api
Disallow: /messaging
Disallow: /notifications
Disallow: /settings

Sitemap: ${baseUrl}/sitemap.xml

# Optimisations pour les moteurs de recherche
User-agent: Googlebot
Allow: /
Crawl-delay: 1

User-agent: Bingbot
Allow: /
Crawl-delay: 2

User-agent: Slurp
Allow: /
Crawl-delay: 3`;

  res.set('Content-Type', 'text/plain');
  res.set('Cache-Control', 'public, max-age=86400'); // Cache 24 heures
  res.send(robotsTxt);
});

module.exports = router;
