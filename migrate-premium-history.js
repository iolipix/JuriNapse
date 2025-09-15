const mongoose = require('mongoose');
require('dotenv').config({ path: 'config/.env' });

const User = require('./backend/models/user.model');

const migratePremiumHistory = async () => {
  try {
    console.log('Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connecté à MongoDB');

    const usersWithPremiumData = await User.find({
      $or: [
        { premiumGrantedAt: { $exists: true, $ne: null } },
        { premiumGrantedBy: { $exists: true, $ne: null } },
        { premiumExpiresAt: { $exists: true, $ne: null } }
      ]
    });

    console.log(`Trouvé ${usersWithPremiumData.length} utilisateurs avec des données premium`);

    let migratedCount = 0;

    for (const user of usersWithPremiumData) {
      try {
        console.log(`Migration pour ${user.username}...`);
        
        if (!user.premiumHistory || user.premiumHistory.length === 0) {
          const historyEntry = {
            grantedBy: user.premiumGrantedBy || null,
            grantedAt: user.premiumGrantedAt || new Date('2024-01-01'),
            expiresAt: user.premiumExpiresAt || null,
            revokedAt: null,
            revokedBy: null,
            isActive: user.hasRole('premium')
          };

          if (!user.hasRole('premium')) {
            if (user.premiumExpiresAt && user.premiumExpiresAt <= new Date()) {
              historyEntry.revokedAt = user.premiumExpiresAt;
            } else {
              historyEntry.revokedAt = new Date();
            }
            historyEntry.isActive = false;
          }

          user.premiumHistory = [historyEntry];
          
          await user.save();
          migratedCount++;
          
          console.log(`Migré pour ${user.username} - Actif: ${historyEntry.isActive}`);
        } else {
          console.log(`${user.username} a déjà un historique`);
        }
      } catch (error) {
        console.error(`Erreur pour ${user.username}:`, error.message);
      }
    }

    console.log(`Migration terminée ! ${migratedCount} utilisateurs migrés`);

  } catch (error) {
    console.error('Erreur lors de la migration:', error);
  } finally {
    console.log('Déconnexion de MongoDB');
    await mongoose.disconnect();
  }
};

migratePremiumHistory();
