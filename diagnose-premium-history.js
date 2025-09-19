const mongoose = require('mongoose');
require('dotenv').config({ path: 'config/.env' });

const User = require('./backend/models/user.model');

const diagnosePremiumHistory = async () => {
  try {
    console.log('🔍 Diagnostic complet de l\'historique premium...');
    
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.log('⚠️  MONGODB_URI non trouvé. Exécutez sur Railway avec:');
      console.log('   railway run node diagnose-premium-history.js');
      return;
    }
    
    await mongoose.connect(uri);
    console.log('✅ Connecté à MongoDB');

    // 1. Utilisateurs avec premium actuel
    const currentPremiumUsers = await User.find({
      role: { $regex: 'premium' }
    }).select('username role premiumGrantedAt premiumExpiresAt premiumGrantedBy premiumHistory');

    console.log(`\n👑 Utilisateurs avec premium actuel: ${currentPremiumUsers.length}`);
    currentPremiumUsers.forEach(user => {
      console.log(`   📱 ${user.username}:`);
      console.log(`      - Rôles: ${user.role}`);
      console.log(`      - Accordé: ${user.premiumGrantedAt || 'null'}`);
      console.log(`      - Expire: ${user.premiumExpiresAt || 'jamais'}`);
      console.log(`      - Historique: ${user.premiumHistory?.length || 0} entrées`);
      
      if (user.premiumHistory && user.premiumHistory.length > 0) {
        user.premiumHistory.forEach((entry, index) => {
          console.log(`         ${index + 1}. Accordé: ${entry.grantedAt}, Expire: ${entry.expiresAt || 'jamais'}, Actif: ${entry.isActive}, Révoqué: ${entry.revokedAt || 'non'}`);
        });
      }
    });

    // 2. Utilisateurs sans premium mais avec historique
    const usersWithHistory = await User.find({
      role: { $not: { $regex: 'premium' } },
      premiumHistory: { $exists: true, $ne: [] }
    }).select('username role premiumHistory');

    console.log(`\n📚 Utilisateurs sans premium mais avec historique: ${usersWithHistory.length}`);
    usersWithHistory.forEach(user => {
      console.log(`   👤 ${user.username}:`);
      console.log(`      - Rôles: ${user.role}`);
      console.log(`      - Historique: ${user.premiumHistory?.length || 0} entrées`);
      
      if (user.premiumHistory && user.premiumHistory.length > 0) {
        user.premiumHistory.forEach((entry, index) => {
          console.log(`         ${index + 1}. Accordé: ${entry.grantedAt}, Expire: ${entry.expiresAt || 'jamais'}, Actif: ${entry.isActive}, Révoqué: ${entry.revokedAt || 'non'}`);
        });
      }
    });

    // 3. Utilisateurs avec données premium mais sans historique
    const usersWithoutHistory = await User.find({
      $or: [
        { premiumGrantedAt: { $exists: true, $ne: null } },
        { premiumGrantedBy: { $exists: true, $ne: null } },
        { premiumExpiresAt: { $exists: true, $ne: null } }
      ],
      $or: [
        { premiumHistory: { $exists: false } },
        { premiumHistory: null },
        { premiumHistory: [] }
      ]
    }).select('username role premiumGrantedAt premiumExpiresAt premiumGrantedBy premiumHistory');

    console.log(`\n⚠️  Utilisateurs avec données premium mais sans historique: ${usersWithoutHistory.length}`);
    usersWithoutHistory.forEach(user => {
      console.log(`   🚨 ${user.username}:`);
      console.log(`      - Rôles: ${user.role}`);
      console.log(`      - Accordé: ${user.premiumGrantedAt || 'null'}`);
      console.log(`      - Expire: ${user.premiumExpiresAt || 'null'}`);
      console.log(`      - Historique: ${user.premiumHistory?.length || 0} entrées`);
    });

    // 4. Test de getPremiumInfo sur un utilisateur
    const testUser = currentPremiumUsers[0] || usersWithHistory[0];
    if (testUser) {
      console.log(`\n🧪 Test getPremiumInfo() sur ${testUser.username}:`);
      const premiumInfo = testUser.getPremiumInfo();
      console.log('   📊 Résultat:');
      console.log(JSON.stringify(premiumInfo, null, 4));
    }

    // 5. Statistiques globales
    const totalUsers = await User.countDocuments();
    const usersWithPremiumData = await User.countDocuments({
      $or: [
        { role: { $regex: 'premium' } },
        { premiumGrantedAt: { $exists: true, $ne: null } },
        { premiumHistory: { $exists: true, $ne: [] } }
      ]
    });

    console.log(`\n📈 Statistiques globales:`);
    console.log(`   👥 Total utilisateurs: ${totalUsers}`);
    console.log(`   💎 Avec données premium: ${usersWithPremiumData}`);
    console.log(`   👑 Premium actuel: ${currentPremiumUsers.length}`);
    console.log(`   📚 Avec historique: ${usersWithHistory.length + currentPremiumUsers.filter(u => u.premiumHistory?.length > 0).length}`);
    console.log(`   🚨 Problèmes détectés: ${usersWithoutHistory.length}`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    console.log('🔌 Déconnexion de MongoDB');
    await mongoose.disconnect();
  }
};

diagnosePremiumHistory();