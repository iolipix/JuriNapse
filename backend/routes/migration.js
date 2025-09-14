const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const { authenticateToken } = require('../middleware/auth.middleware');

// Middleware pour vérifier que l'utilisateur est administrateur
const adminAuth = (req, res, next) => {
  const userRoles = req.user.role ? req.user.role.split(';').map(r => r.trim()) : [];
  const hasAdminRole = userRoles.includes('administrator');
  
  if (!hasAdminRole) {
    return res.status(403).json({ message: 'Accès refusé. Permissions administrateur requises.' });
  }
  next();
};

// Route pour migrer les utilisateurs premium existants
router.post('/migrate-premium-users', authenticateToken, adminAuth, async (req, res) => {
  try {
    console.log('🔍 Début de la migration des utilisateurs premium...');

    // Trouver tous les utilisateurs qui ont premiumExpiresAt mais pas le rôle premium
    const usersWithPremiumExpiration = await User.find({
      $or: [
        { premiumExpiresAt: { $exists: true, $ne: null } },
        { premiumGrantedAt: { $exists: true, $ne: null } }
      ]
    });

    console.log(`📊 Trouvé ${usersWithPremiumExpiration.length} utilisateurs avec des données premium`);

    let fixedCount = 0;
    const report = [];

    for (const user of usersWithPremiumExpiration) {
      const hasPremiumRole = user.hasRole('premium');
      const hasValidPremium = !user.premiumExpiresAt || user.premiumExpiresAt > new Date();
      
      const userReport = {
        username: user.username,
        currentRoles: user.role,
        hasPremiumRole,
        premiumExpires: user.premiumExpiresAt ? user.premiumExpiresAt.toISOString() : 'Permanent',
        hasValidPremium,
        action: 'none'
      };

      if (hasValidPremium && !hasPremiumRole) {
        console.log(`➡️ Ajout du rôle premium pour ${user.username}...`);
        user.addRole('premium');
        await user.save();
        fixedCount++;
        userReport.action = 'added_premium_role';
        userReport.newRoles = user.role;
        console.log(`✅ Rôle premium ajouté pour ${user.username}. Nouveaux rôles: ${user.role}`);
      } else if (!hasValidPremium && hasPremiumRole) {
        console.log(`➡️ Suppression du rôle premium (expiré) pour ${user.username}...`);
        user.removeRole('premium');
        user.premiumExpiresAt = null;
        user.premiumGrantedBy = null;
        user.premiumGrantedAt = null;
        await user.save();
        fixedCount++;
        userReport.action = 'removed_expired_premium';
        userReport.newRoles = user.role;
        console.log(`✅ Rôle premium supprimé pour ${user.username}. Nouveaux rôles: ${user.role}`);
      } else {
        console.log(`✓ Utilisateur ${user.username} déjà correct`);
        userReport.action = 'already_correct';
      }

      report.push(userReport);
    }

    console.log(`🎉 Migration terminée ! ${fixedCount} utilisateurs corrigés`);

    res.json({
      success: true,
      message: `Migration terminée avec succès`,
      statistics: {
        totalUsers: usersWithPremiumExpiration.length,
        fixedUsers: fixedCount,
        alreadyCorrect: usersWithPremiumExpiration.length - fixedCount
      },
      detailedReport: report
    });

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la migration',
      error: error.message 
    });
  }
});

module.exports = router;