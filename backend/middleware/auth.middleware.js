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

    // S'assurer que le rôle est défini et que l'ID est accessible
    req.user = {
      ...user.toObject(),
      id: user._id.toString(), // Ajouter l'ID pour compatibilité
      role: user.role || 'user'
    };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }
};

// Middleware d'authentification optionnelle - ne bloque pas si pas de token
const optionalAuthenticateToken = async (req, res, next) => {
  console.log(`🔐 [DEBUG] Optional Auth middleware - Nouvelle requête: ${req.method} ${req.path}`);
  try {
    // Lire le token depuis les cookies ou l'en-tête Authorization
    let token = req.cookies.jurinapse_token;
    
    // Si pas de token dans les cookies, vérifier l'en-tête Authorization
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    // Si pas de token, continuer sans user
    if (!token) {
      console.log(`⚠️ [DEBUG] Pas de token - continuer sans authentification`);
      req.user = null;
      return next();
    }

    // Vérifier le token s'il existe
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(`✅ [DEBUG] Token décodé avec succès pour l'utilisateur: ${decoded.userId}`);
    
    const user = await User.findById(decoded.userId).select('-password -refreshToken').lean();
    if (!user || user.isDeleted) {
      console.log(`❌ [DEBUG] Utilisateur non trouvé ou supprimé: ${decoded.userId}`);
      req.user = null;
    } else {
      req.user = user;
      console.log(`👤 [DEBUG] Utilisateur authentifié: ${user.username}`);
    }
    
    next();
  } catch (error) {
    console.log(`⚠️ [DEBUG] Erreur d'authentification optionnelle: ${error.message} - continuer sans auth`);
    req.user = null;
    next();
  }
};

module.exports = { authenticateToken, optionalAuthenticateToken };
