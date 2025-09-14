const User = require('../models/user.model');

/**
 * Middleware qui vérifie et met à jour automatiquement le statut premium des utilisateurs
 * Doit être utilisé après authenticateToken pour avoir accès à req.user
 */
const checkPremiumExpiration = async (req, res, next) => {
  try {
    // Si pas d'utilisateur authentifié, continuer
    if (!req.user || !req.user.id) {
      return next();
    }

    // Récupérer l'utilisateur complet depuis la base de données
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return next();
    }

    // Vérifier si l'utilisateur a le premium et s'il a expiré
    if (user.hasRole('premium') && user.premiumExpiresAt) {
      const now = new Date();
      
      if (user.premiumExpiresAt <= now) {
        // Premium expiré, le retirer
        console.log(`🕒 Premium expiré pour l'utilisateur ${user.username} (${user._id})`);
        
        user.revokePremium();
        await user.save();
        
        // Mettre à jour req.user pour cette requête
        req.user = { ...req.user, ...user.toObject() };
      }
    }

    next();
  } catch (error) {
    console.error('Erreur lors de la vérification du premium:', error);
    // Continuer malgré l'erreur pour ne pas bloquer l'application
    next();
  }
};

/**
 * Middleware optionnel pour les routes qui nécessitent un premium valide
 */
const requireValidPremium = async (req, res, next) => {
  try {
    // Vérifier d'abord l'expiration
    await checkPremiumExpiration(req, res, () => {});

    const user = await User.findById(req.user.id);
    
    if (!user || !user.isPremium()) {
      return res.status(403).json({
        success: false,
        message: 'Accès premium requis',
        premiumExpired: user && user.hasRole('premium') && user.premiumExpiresAt && user.premiumExpiresAt <= new Date()
      });
    }

    next();
  } catch (error) {
    console.error('Erreur lors de la vérification du premium requis:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

module.exports = {
  checkPremiumExpiration,
  requireValidPremium
};