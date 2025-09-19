/**
 * Script de réparation rapide de l'historique premium
 * À exécuter sur Railway avec: railway run node fix-premium-simple.js
 */
const mongoose = require('mongoose');
require('dotenv').config({ path: 'config/.env' });

const User = require('./backend/models/user.model');

const fixPremiumSimple = async () => {
  try {
    console.log('🔧 Réparation rapide historique premium...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // 1. Utilisateurs avec données premium mais sans historique
    const usersWithoutHistory = await User.find({
      $or: [
        { premiumGrantedAt: { $exists: true, $ne: null } },
        { premiumGrantedBy: { $exists: true, $ne: null } },
        { premiumExpiresAt: { $exists: true, $ne: null } }
      ],
      $and: [
        {
          $or: [
            { premiumHistory: { $exists: false } },
            { premiumHistory: null },
            { premiumHistory: [] }
          ]
        }
      ]
    });

    console.log(`🔍 Utilisateurs à corriger: ${usersWithoutHistory.length}`);
    
    let fixedCount = 0;
    for (const user of usersWithoutHistory) {
      try {
        console.log(`➡️ ${user.username}...`);
        
        if (!user.premiumHistory) {
          user.premiumHistory = [];
        }

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

        user.premiumHistory.push(historyEntry);
        await user.save();
        
        console.log(`   ✅ Corrigé (actif: ${historyEntry.isActive})`);
        fixedCount++;
        
      } catch (error) {
        console.log(`   ❌ Erreur: ${error.message}`);
      }
    }

    // 2. Vérification cohérence
    const usersWithHistory = await User.find({
      premiumHistory: { $exists: true, $ne: [] }
    });

    console.log(`\n🔍 Vérification cohérence: ${usersWithHistory.length} utilisateurs`);
    
    let coherenceFixed = 0;
    for (const user of usersWithHistory) {
      try {
        const hasPremium = user.hasRole('premium');
        const activeEntries = user.premiumHistory.filter(entry => entry.isActive && !entry.revokedAt);
        
        let needsSave = false;
        
        if (hasPremium && activeEntries.length === 0) {
          // Premium actif mais pas d'entrée active
          const newEntry = {
            grantedBy: user.premiumGrantedBy || null,
            grantedAt: user.premiumGrantedAt || new Date(),
            expiresAt: user.premiumExpiresAt || null,
            revokedAt: null,
            revokedBy: null,
            isActive: true
          };
          user.premiumHistory.push(newEntry);
          needsSave = true;
          console.log(`   🔧 ${user.username}: Entrée active créée`);
          
        } else if (!hasPremium && activeEntries.length > 0) {
          // Pas de premium mais entrées actives
          activeEntries.forEach(entry => {
            entry.isActive = false;
            entry.revokedAt = entry.revokedAt || new Date();
          });
          needsSave = true;
          console.log(`   🔧 ${user.username}: Entrées marquées révoquées`);
          
        } else if (activeEntries.length > 1) {
          // Plusieurs entrées actives
          activeEntries.sort((a, b) => new Date(b.grantedAt) - new Date(a.grantedAt));
          for (let i = 1; i < activeEntries.length; i++) {
            activeEntries[i].isActive = false;
            activeEntries[i].revokedAt = activeEntries[i].revokedAt || new Date();
          }
          needsSave = true;
          console.log(`   🔧 ${user.username}: Doublons supprimés`);
        }

        if (needsSave) {
          await user.save();
          coherenceFixed++;
        }
        
      } catch (error) {
        console.log(`   ❌ ${user.username}: ${error.message}`);
      }
    }

    // 3. Statistiques finales
    const stats = {
      total: await User.countDocuments(),
      currentPremium: await User.countDocuments({ role: { $regex: 'premium' } }),
      withHistory: await User.countDocuments({ premiumHistory: { $exists: true, $ne: [] } })
    };

    console.log(`\n📊 RÉSULTATS:`);
    console.log(`   👥 Total utilisateurs: ${stats.total}`);
    console.log(`   👑 Premium actuel: ${stats.currentPremium}`);
    console.log(`   📚 Avec historique: ${stats.withHistory}`);
    console.log(`   🔧 Corrigés (historique): ${fixedCount}`);
    console.log(`   🔧 Corrigés (cohérence): ${coherenceFixed}`);

    console.log(`\n✅ RÉPARATION TERMINÉE !`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté');
  }
};

fixPremiumSimple();