const mongoose = require('mongoose');
require('dotenv').config({ path: 'config/.env' });

const User = require('./backend/models/user.model');
const fs = require('fs');

const fixPremiumHistory = async () => {
  try {
    console.log('🔧 Correction complète de l\'historique premium...');
    
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.log('⚠️  MONGODB_URI non trouvé. Exécutez sur Railway avec:');
      console.log('   railway run node fix-premium-history.js');
      return;
    }
    
    await mongoose.connect(uri);
    console.log('✅ Connecté à MongoDB');

    // Créer un fichier de log détaillé
    const logFile = `premium-history-log-${new Date().toISOString().split('T')[0]}.txt`;
    const log = (message) => {
      console.log(message);
      fs.appendFileSync(logFile, message + '\n');
    };

    log('🎯 DÉBUT DE LA CORRECTION DE L\'HISTORIQUE PREMIUM');
    log(`📅 Date: ${new Date().toISOString()}`);
    log('');

    // 1. Corriger les utilisateurs avec données premium mais sans historique
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

    log(`🔍 ÉTAPE 1: Correction des utilisateurs sans historique (${usersWithoutHistory.length})`);
    
    let fixedCount = 0;
    for (const user of usersWithoutHistory) {
      try {
        log(`\n➡️  Correction de ${user.username}:`);
        log(`   📊 Données actuelles:`);
        log(`      - Rôles: ${user.role}`);
        log(`      - Accordé: ${user.premiumGrantedAt || 'null'}`);
        log(`      - Expire: ${user.premiumExpiresAt || 'null'}`);
        log(`      - Accordé par: ${user.premiumGrantedBy || 'null'}`);

        // Initialiser le tableau d'historique
        if (!user.premiumHistory) {
          user.premiumHistory = [];
        }

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
            log(`      ⏰ Premium expiré le ${user.premiumExpiresAt.toISOString()}`);
          } else {
            // Révoqué manuellement ou données incohérentes
            historyEntry.revokedAt = new Date();
            log(`      🚫 Premium supposé révoqué`);
          }
          historyEntry.isActive = false;
        } else {
          log(`      ✅ Premium encore actif`);
        }

        user.premiumHistory.push(historyEntry);
        await user.save();
        
        log(`   ✅ Historique créé avec succès`);
        log(`      - Entrée active: ${historyEntry.isActive}`);
        log(`      - Accordé: ${historyEntry.grantedAt}`);
        log(`      - Expire: ${historyEntry.expiresAt || 'jamais'}`);
        log(`      - Révoqué: ${historyEntry.revokedAt || 'non'}`);
        
        fixedCount++;
      } catch (error) {
        log(`   ❌ Erreur pour ${user.username}: ${error.message}`);
      }
    }

    log(`\n📊 ÉTAPE 1 TERMINÉE: ${fixedCount} utilisateurs corrigés`);

    // 2. Vérifier et corriger la cohérence des historiques existants
    const usersWithHistory = await User.find({
      premiumHistory: { $exists: true, $ne: [] }
    });

    log(`\n🔍 ÉTAPE 2: Vérification de la cohérence des historiques (${usersWithHistory.length})`);
    
    let coherenceFixedCount = 0;
    for (const user of usersWithHistory) {
      try {
        let needsSave = false;
        const hasPremium = user.hasRole('premium');
        
        log(`\n🔎 Vérification de ${user.username}:`);
        log(`   🎭 A premium: ${hasPremium}`);
        log(`   📚 Historique: ${user.premiumHistory.length} entrées`);

        // Trouver l'entrée active
        const activeEntries = user.premiumHistory.filter(entry => entry.isActive && !entry.revokedAt);
        
        if (hasPremium && activeEntries.length === 0) {
          // L'utilisateur a premium mais aucune entrée active
          log(`   ⚠️  PROBLÈME: Premium actif mais aucune entrée active dans l'historique`);
          
          // Créer une nouvelle entrée active basée sur les données actuelles
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
          log(`   ✅ Nouvelle entrée active créée`);
          
        } else if (!hasPremium && activeEntries.length > 0) {
          // L'utilisateur n'a pas premium mais a des entrées actives
          log(`   ⚠️  PROBLÈME: Pas de premium mais entrées actives dans l'historique`);
          
          // Marquer toutes les entrées actives comme révoquées
          activeEntries.forEach(entry => {
            entry.isActive = false;
            entry.revokedAt = entry.revokedAt || new Date();
          });
          
          needsSave = true;
          log(`   ✅ ${activeEntries.length} entrées marquées comme révoquées`);
          
        } else if (activeEntries.length > 1) {
          // Plusieurs entrées actives (ne devrait pas arriver)
          log(`   ⚠️  PROBLÈME: ${activeEntries.length} entrées actives (max 1 attendu)`);
          
          // Garder seulement la plus récente active
          activeEntries.sort((a, b) => new Date(b.grantedAt) - new Date(a.grantedAt));
          for (let i = 1; i < activeEntries.length; i++) {
            activeEntries[i].isActive = false;
            activeEntries[i].revokedAt = activeEntries[i].revokedAt || new Date();
          }
          
          needsSave = true;
          log(`   ✅ Gardé seulement l'entrée la plus récente active`);
        } else {
          log(`   ✅ Historique cohérent`);
        }

        if (needsSave) {
          await user.save();
          coherenceFixedCount++;
          log(`   💾 Sauvegardé`);
        }

      } catch (error) {
        log(`   ❌ Erreur pour ${user.username}: ${error.message}`);
      }
    }

    log(`\n📊 ÉTAPE 2 TERMINÉE: ${coherenceFixedCount} utilisateurs avec historique corrigé`);

    // 3. Statistiques finales et test
    log(`\n🔍 ÉTAPE 3: Vérification finale`);
    
    const finalStats = {
      totalUsers: await User.countDocuments(),
      currentPremium: await User.countDocuments({ role: { $regex: 'premium' } }),
      withHistory: await User.countDocuments({ premiumHistory: { $exists: true, $ne: [] } }),
      withoutHistory: await User.countDocuments({
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
      })
    };

    log(`\n📈 STATISTIQUES FINALES:`);
    log(`   👥 Total utilisateurs: ${finalStats.totalUsers}`);
    log(`   👑 Premium actuel: ${finalStats.currentPremium}`);
    log(`   📚 Avec historique: ${finalStats.withHistory}`);
    log(`   🚨 Encore sans historique: ${finalStats.withoutHistory}`);
    log(`   🔧 Utilisateurs corrigés (étape 1): ${fixedCount}`);
    log(`   🔧 Historiques corrigés (étape 2): ${coherenceFixedCount}`);

    // Test getPremiumInfo
    const testUser = await User.findOne({ premiumHistory: { $exists: true, $ne: [] } });
    if (testUser) {
      log(`\n🧪 Test getPremiumInfo() sur ${testUser.username}:`);
      const premiumInfo = testUser.getPremiumInfo();
      log(`   📊 Résultat:`);
      log(`      - A premium: ${premiumInfo.hasPremium}`);
      log(`      - Permanent: ${premiumInfo.isPermanent}`);
      log(`      - Expire: ${premiumInfo.expiresAt || 'jamais'}`);
      log(`      - Accordé: ${premiumInfo.grantedAt || 'null'}`);
      log(`      - Historique: ${premiumInfo.history?.length || 0} entrées`);
    }

    log(`\n✅ CORRECTION TERMINÉE AVEC SUCCÈS !`);
    log(`📄 Log détaillé sauvegardé dans: ${logFile}`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
  } finally {
    console.log('🔌 Déconnexion de MongoDB');
    await mongoose.disconnect();
  }
};

fixPremiumHistory();