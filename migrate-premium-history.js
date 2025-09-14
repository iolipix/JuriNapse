const mongoose = require('mongoose');
const User = require('./backend/models/user.model');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jurinapse';

const migratePremiumHistory = async () => {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Trouver tous les utilisateurs avec des informations premium
    const usersWithPremiumData = await User.find({
      $or: [
        { premiumGrantedAt: { $exists: true, $ne: null } },
        { premiumGrantedBy: { $exists: true, $ne: null } },
        { premiumExpiresAt: { $exists: true, $ne: null } }
      ]
    });

    console.log(`📊 Trouvé ${usersWithPremiumData.length} utilisateurs avec des données premium`);

    let migratedCount = 0;

    for (const user of usersWithPremiumData) {
      // Vérifier si l'utilisateur a déjà un historique
      if (user.premiumHistory && user.premiumHistory.length > 0) {
        console.log(`⏭️ ${user.username} a déjà un historique, ignoré`);
        continue;
      }

      // Créer une entrée d'historique basée sur les données actuelles
      if (user.premiumGrantedAt && user.premiumGrantedBy) {
        const isActive = user.hasRole('premium');
        let revokedAt = null;
        
        // Si le premium a expiré, calculer quand il a expiré
        if (!isActive && user.premiumExpiresAt && user.premiumExpiresAt < new Date()) {
          revokedAt = user.premiumExpiresAt;
        }

        const historyEntry = {
          grantedBy: user.premiumGrantedBy,
          grantedAt: user.premiumGrantedAt,
          expiresAt: user.premiumExpiresAt,
          revokedAt: revokedAt,
          revokedBy: null, // Expiration automatique
          isActive: isActive && (!user.premiumExpiresAt || user.premiumExpiresAt > new Date())
        };

        user.premiumHistory = [historyEntry];
        await user.save();
        
        console.log(`✅ Historique migré pour ${user.username} - Actif: ${historyEntry.isActive}`);
        migratedCount++;
      }
    }

    console.log(`🎉 Migration terminée ! ${migratedCount} utilisateurs migrés`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
};

// Exécuter la migration
migratePremiumHistory();