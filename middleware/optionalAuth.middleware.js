const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// Middleware d'authentification optionnel avec cookies HTTP
// Définit req.user si un token valide est fourni, sinon req.user reste undefined
const optionalAuthenticateToken = async (req, res, next) => {
  try {
    // Lire le token depuis les cookies au lieu des headers
    const token = req.cookies.jurinapse_token;

    if (!token) {
      // Pas de token, continuer sans utilisateur
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jurinapse_secret_key');
    const user = await User.findById(decoded.userId);

    if (!user) {
      // Token invalide, continuer sans utilisateur
      req.user = null;
      return next();
    }

    req.user = user;
    next();
  } catch (error) {
    // En cas d'erreur, continuer sans utilisateur
    req.user = null;
    next();
  }
};

module.exports = optionalAuthenticateToken;
