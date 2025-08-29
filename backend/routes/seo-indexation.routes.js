const express = require('express');
const router = express.Router();
const https = require('https');
const http = require('http');

// Fonction fetch native pour remplacer node-fetch
function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          statusText: res.statusMessage,
          text: () => Promise.resolve(data),
          json: () => Promise.resolve(JSON.parse(data))
        });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

/**
 * Routes SEO pour l'indexation automatique des profils
 * Ces routes permettent de faire les appels externes sans problème CORS
 */

// Configuration IndexNow
const INDEX_NOW_CONFIG = {
  apiUrl: 'https://api.indexnow.org/indexnow',
  key: process.env.INDEX_NOW_KEY || 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
  host: 'jurinapse.com',
  baseUrl: 'https://jurinapse.com'
};

/**
 * POST /api/seo/submit-profile
 * Soumettre un profil utilisateur pour indexation
 */
router.post('/submit-profile', async (req, res) => {
  try {
    const { username, fullName } = req.body;

    if (!username || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Username et fullName requis'
      });
    }

    const profileUrl = `${INDEX_NOW_CONFIG.baseUrl}/profile/${username}`;
    
    console.log(`🚀 [BACKEND] Soumission profil pour indexation: ${fullName} (${profileUrl})`);

    // 1. Soumettre à IndexNow
    const indexNowResult = await submitToIndexNow(profileUrl);
    
    // 2. Ping Google
    const googleResult = await pingGoogle();
    
    res.json({
      success: true,
      message: `Profil ${fullName} soumis pour indexation`,
      details: {
        indexNow: indexNowResult,
        google: googleResult,
        profileUrl
      }
    });

  } catch (error) {
    console.error('❌ Erreur soumission profil SEO:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la soumission SEO',
      error: error.message
    });
  }
});

/**
 * POST /api/seo/submit-url
 * Soumettre une URL quelconque pour indexation
 */
router.post('/submit-url', async (req, res) => {
  try {
    const { url, title } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL requise'
      });
    }

    console.log(`🚀 [BACKEND] Soumission URL pour indexation: ${title || url}`);

    const indexNowResult = await submitToIndexNow(url);
    const googleResult = await pingGoogle();
    
    res.json({
      success: true,
      message: 'URL soumise pour indexation',
      details: {
        indexNow: indexNowResult,
        google: googleResult,
        url
      }
    });

  } catch (error) {
    console.error('❌ Erreur soumission URL SEO:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la soumission SEO',
      error: error.message
    });
  }
});

/**
 * Fonction utilitaire - Soumettre à IndexNow
 */
async function submitToIndexNow(url) {
  try {
    const response = await fetch(INDEX_NOW_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'JuriNapse-SEO/1.0'
      },
      body: JSON.stringify({
        host: INDEX_NOW_CONFIG.host,
        key: INDEX_NOW_CONFIG.key,
        keyLocation: `${INDEX_NOW_CONFIG.baseUrl}/indexnow-key.txt`,
        urlList: [url]
      })
    });

    if (response.ok) {
      console.log(`✅ IndexNow: URL soumise avec succès - ${url}`);
      return { success: true, message: 'URL soumise à IndexNow' };
    } else {
      const errorText = await response.text();
      console.warn(`⚠️ IndexNow: Échec ${response.status} - ${errorText}`);
      return { 
        success: false, 
        message: `Échec IndexNow: ${response.status}`,
        error: errorText 
      };
    }
  } catch (error) {
    console.error('❌ IndexNow: Erreur réseau:', error);
    return { 
      success: false, 
      message: 'Erreur réseau IndexNow',
      error: error.message 
    };
  }
}

/**
 * Fonction utilitaire - Ping Google
 */
async function pingGoogle() {
  try {
    const sitemapUrl = `${INDEX_NOW_CONFIG.baseUrl}/sitemap.xml`;
    const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
    
    const response = await fetch(pingUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'JuriNapse-SEO/1.0'
      }
    });

    if (response.ok) {
      console.log(`✅ Google: Sitemap ping réussi`);
      return { success: true, message: 'Google notifié via ping sitemap' };
    } else {
      console.warn(`⚠️ Google: Échec ping ${response.status}`);
      return { 
        success: false, 
        message: `Échec ping Google: ${response.status}` 
      };
    }
  } catch (error) {
    console.error('❌ Google: Erreur ping:', error);
    return { 
      success: false, 
      message: 'Erreur ping Google',
      error: error.message 
    };
  }
}

/**
 * GET /indexnow-key.txt
 * Servir la clé IndexNow pour validation (route racine)
 */
router.get('/indexnow-key.txt', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(INDEX_NOW_CONFIG.key);
});

module.exports = router;
