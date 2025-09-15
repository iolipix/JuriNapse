const mongoose = require('mongoose');
require('dotenv').config({ path: 'config/.env' });

const User = require('./backend/models/user.model');

const initializePremiumHistory = async () => {
  try {
    console.log('🔧 Initialisation du champ premiumHistory...');
    
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.log('⚠️  MONGODB_URI non trouvé. Exécutez sur Railway avec:');
      console.log('   railway run node initialize-premium-history.js');
      return;
    }
    
    await mongoose.connect(uri);
    console.log('✅ Connecté à MongoDB');

    // Trouver tous les utilisateurs qui n'ont pas de champ premiumHistory initialisé
    const usersWithoutHistory = await User.find({
      $or: [
        { premiumHistory: { $exists: false } },
        { premiumHistory: null },
        { premiumHistory: [] }
      ]
    });

    console.log(`📊 Trouvé ${usersWithoutHistory.length} utilisateurs sans historique premium`);

    let initializedCount = 0;
    let migratedCount = 0;

    for (const user of usersWithoutHistory) {
      try {
        console.log(`➡️ Traitement de ${user.username}...`);
        
        // Initialiser le tableau d'historique s'il n'existe pas
        if (!user.premiumHistory) {
          user.premiumHistory = [];
          console.log(`   📋 Champ premiumHistory initialisé`);
        }

        // Vérifier s'il a des données premium existantes à migrer
        const hasPremiumData = user.premiumGrantedAt || user.premiumGrantedBy || user.premiumExpiresAt;
        
        if (hasPremiumData) {
          console.log(`   🎯 Données premium détectées, création de l'historique...`);
          
          // Créer une entrée d'historique basée sur les données actuelles
          const historyEntry = {
            grantedBy: user.premiumGrantedBy || null,
            grantedAt: user.premiumGrantedAt || new Date('2024-01-01'),
            expiresAt: user.premiumExpiresAt || null,
            revokedAt: null,
            revokedBy: null,
            isActive: user.hasRole('premium')
          };

          // Si l'utilisateur n'a plus le rôle premium, marquer comme révoqué/expiré
          if (!user.hasRole('premium')) {
            if (user.premiumExpiresAt && user.premiumExpiresAt <= new Date()) {
              // Expiré
              historyEntry.revokedAt = user.premiumExpiresAt;
              console.log(`   📅 Premium expiré le ${user.premiumExpiresAt.toISOString()}`);
            } else {
              // Révoqué manuellement (supposé)
              historyEntry.revokedAt = new Date();
              console.log(`   🚫 Premium supposé révoqué`);
            }
            historyEntry.isActive = false;
          }

          // Ajouter l'entrée à l'historique seulement si le tableau est vide
          if (user.premiumHistory.length === 0) {
            user.premiumHistory.push(historyEntry);
            migratedCount++;
            console.log(`   ✅ Entrée d'historique créée (actif: ${historyEntry.isActive})`);
          }
        }

        await user.save();
        initializedCount++;
        
        console.log(`✅ ${user.username} traité`);
        
      } catch (error) {
        console.error(`❌ Erreur pour ${user.username}:`, error.message);
      }
    }

    console.log(`\n🎉 Initialisation terminée !`);
    console.log(`   📋 ${initializedCount} utilisateurs initialisés`);
    console.log(`   🎯 ${migratedCount} historiques créés depuis des données existantes`);

    // Vérifier quelques utilisateurs pour s'assurer que ça marche
    console.log('\n🔍 Vérification...');
    const sampleUsers = await User.find({ 
      $or: [
        { username: /test/i },
        { role: { $regex: 'premium' } }
      ]
    }).limit(3).select('username role premiumHistory premiumGrantedAt');

    sampleUsers.forEach(user => {
      console.log(`   👤 ${user.username}: ${user.premiumHistory?.length || 0} entrées d'historique`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    console.log('🔌 Déconnexion de MongoDB');
    await mongoose.disconnect();
  }
};

initializePremiumHistory();