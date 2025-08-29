const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// Middleware d'authentification JWT avec cookies HTTP
const authenticateToken = async (req, res, next) => {
  console.log(`🔐 [DEBUG] Auth middleware - Nouvelle requête: ${req.method} ${req.path}`);
  try {
    // Lire le token depuis les cookies ou l'en-tête Authorization
    let token = req.cookies.jurinapse_token;
    console.log(`🍪 [DEBUG] Token depuis les cookies: ${token ? 'trouvé' : 'non trouvé'}`);
    
    // Si pas de token dans les cookies, vérifier l'en-tête Authorization
    if (!token) {
      const authHeader = req.headers.authorization;
      console.log(`📋 [DEBUG] En-tête Authorization: ${authHeader || 'non trouvé'}`);
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
        console.log(`🎫 [DEBUG] Token extrait de l'en-tête: ${token ? 'trouvé' : 'non trouvé'}`);
      }
    }

    if (!token) {
      console.log(`❌ [DEBUG] Aucun token trouvé - rejet de la requête`);
      return res.status(401).json({
        success: false,
        message: 'Token manquant'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jurinapse_secret_key');
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }
};

module.exports = authenticateToken;
