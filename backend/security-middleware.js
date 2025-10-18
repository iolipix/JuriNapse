// 🛡️ Middleware de Sécurité pour JuriNapse
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');

// Rate limiting - Protection contre le spam/brute force
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Rate limits spécifiques
const authLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  15, // 15 tentatives max (au lieu de 5) - Plus permissif
  'Trop de tentatives de connexion. Réessayez dans 15 minutes.'
);

const registerLimiter = createRateLimit(
  60 * 60 * 1000, // 1 heure
  3, // 3 inscriptions max par heure
  'Trop d\'inscriptions. Réessayez dans 1 heure.'
);

const apiLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  500, // 500 requêtes max (2000/heure) - Raisonnable pour usage normal
  'Trop de requêtes. Réessayez plus tard.'
);

// Rate limiter pour les requêtes de navigation (posts, profils, etc.)
const generalApiLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  200, // 200 requêtes max - Suffisant pour navigation normale sans spam
  'Trop de requêtes. Réessayez plus tard.'
);

// Configuration Helmet pour sécuriser les headers HTTP
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://jurinapse-production.up.railway.app"]
    },
  },
  crossOriginEmbedderPolicy: false // Pour compatibilité
});

// Middleware de validation IP (optionnel)
const ipWhitelist = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  
  // Log pour surveillance
  console.log(`🔍 Connexion depuis IP: ${clientIP}`);
  
  // Bloquer les IPs suspectes (à activer si nécessaire)
  const suspiciousIPs = [
    // '192.168.1.100', // Exemple d'IP à bloquer
  ];
  
  if (suspiciousIPs.includes(clientIP)) {
    return res.status(403).json({ 
      error: 'Accès refusé depuis cette adresse IP' 
    });
  }
  
  next();
};

// Export des middlewares
module.exports = {
  authLimiter,
  registerLimiter,
  apiLimiter,
  generalApiLimiter,
  helmetConfig,
  mongoSanitize: mongoSanitize(),
  ipWhitelist
};
