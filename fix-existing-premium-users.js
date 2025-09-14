/**
 * Script de migration pour corriger les utilisateurs premium existants
 * Ce script ajoute le rôle "premium" aux utilisateurs qui ont premiumExpiresAt 
 * mais pas le rôle premium dans leur string de rôles
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Utiliser le modèle User existant
const User = require('./backend/models/user.model');

const fixExistingPremiumUsers = async () => {
  try {
    console.log('🔍 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Trouver tous les utilisateurs qui ont premiumExpiresAt mais pas le rôle premium
    const usersWithPremiumExpiration = await User.find({
      $or: [
        { premiumExpiresAt: { $exists: true, $ne: null } },
        { premiumGrantedAt: { $exists: true, $ne: null } }
      ]
    });

    console.log(`📊 Trouvé ${usersWithPremiumExpiration.length} utilisateurs avec des données premium`);

    let fixedCount = 0;

    for (const user of usersWithPremiumExpiration) {
      const hasPremiumRole = user.hasRole('premium');
      const hasValidPremium = !user.premiumExpiresAt || user.premiumExpiresAt > new Date();
      
      console.log(`\n👤 Utilisateur: ${user.username}`);
      console.log(`   - Rôles actuels: ${user.role}`);
      console.log(`   - A le rôle premium: ${hasPremiumRole}`);
      console.log(`   - Premium expire: ${user.premiumExpiresAt ? user.premiumExpiresAt.toISOString() : 'Permanent'}`);
      console.log(`   - Premium valide: ${hasValidPremium}`);

      if (hasValidPremium && !hasPremiumRole) {
        console.log(`   ➡️ Ajout du rôle premium...`);
        user.addRole('premium');
        await user.save();
        fixedCount++;
        console.log(`   ✅ Rôle premium ajouté. Nouveaux rôles: ${user.role}`);
      } else if (!hasValidPremium && hasPremiumRole) {
        console.log(`   ➡️ Suppression du rôle premium (expiré)...`);
        user.removeRole('premium');
        user.premiumExpiresAt = null;
        user.premiumGrantedBy = null;
        user.premiumGrantedAt = null;
        await user.save();
        fixedCount++;
        console.log(`   ✅ Rôle premium supprimé. Nouveaux rôles: ${user.role}`);
      } else {
        console.log(`   ✓ Utilisateur déjà correct`);
      }
    }

    console.log(`\n🎉 Migration terminée !`);
    console.log(`📈 ${fixedCount} utilisateurs corrigés`);

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
};

// Exécuter le script
if (require.main === module) {
  fixExistingPremiumUsers();
}

module.exports = { fixExistingPremiumUsers };