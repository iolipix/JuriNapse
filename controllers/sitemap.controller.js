const mongoose = require('mongoose');

const generateSitemap = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const baseUrl = req.protocol + '://' + req.get('host');
    
    // Récupérer tous les utilisateurs publics
    const users = await db.collection('users').find({}, {
      projection: { username: 1, updatedAt: 1 }
    }).toArray();
    
    // Récupérer tous les posts publics
    const posts = await db.collection('posts').find({}, {
      projection: { _id: 1, updatedAt: 1 }
    }).toArray();
    
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/feed</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/trending</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`;
    
    // Ajouter les profils utilisateurs
    users.forEach(user => {
      const lastmod = user.updatedAt ? new Date(user.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      sitemap += `
  <url>
    <loc>${baseUrl}/profile/${user.username}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
    });
    
    // Ajouter les posts publics
    posts.forEach(post => {
      const lastmod = post.updatedAt ? new Date(post.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      sitemap += `
  <url>
    <loc>${baseUrl}/post/${post._id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`;
    });
    
    sitemap += `
</urlset>`;
    
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'max-age=3600'); // Cache pendant 1 heure
    res.send(sitemap);
    
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

module.exports = { generateSitemap };
