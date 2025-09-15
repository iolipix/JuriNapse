const mongoose = require('mongoose');
require('dotenv').config({ path: 'config/.env' });

const User = require('./backend/models/user.model');

const testPremiumHistory = async () => {
  try {
    console.log('🧪 Test de création automatique d\'historique premium...');
    
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.log('⚠️  MONGODB_URI non trouvé. Exécutez sur Railway avec:');
      console.log('   railway run node test-premium-auto-history.js');
      return;
    }
    
    await mongoose.connect(uri);
    console.log('✅ Connecté à MongoDB');

    // Trouver l'utilisateur test ou créer un utilisateur de test
    let testUser = await User.findOne({ username: /test/i });
    
    if (!testUser) {
      console.log('❌ Aucun utilisateur test trouvé');
      return;
    }

    console.log(`\n🎯 Utilisateur test: ${testUser.username}`);
    console.log(`   🎭 Rôles avant: ${testUser.role}`);
    console.log(`   📚 Historique avant: ${testUser.premiumHistory?.length || 0} entrées`);

    // Simuler un admin qui attribue le premium
    const adminUser = await User.findOne({ 
      $or: [
        { role: { $regex: 'administrator' } },
        { role: { $regex: 'moderator' } }
      ]
    });

    if (!adminUser) {
      console.log('❌ Aucun admin/modérateur trouvé pour le test');
      return;
    }

    console.log(`\n👑 Attribution de premium par: ${adminUser.username}`);

    // Étape 1: Attribuer un premium temporaire de 1 jour
    console.log('\n📝 Étape 1: Attribution premium 1 jour...');
    testUser.grantPremium(1, adminUser._id); // 1 jour
    await testUser.save();
    
    // Recharger pour voir les changements
    testUser = await User.findById(testUser._id);
    console.log(`   ✅ Premium attribué`);
    console.log(`   🎭 Rôles: ${testUser.role}`);
    console.log(`   📅 Expire: ${testUser.premiumExpiresAt}`);
    console.log(`   📚 Historique: ${testUser.premiumHistory?.length || 0} entrées`);
    
    if (testUser.premiumHistory && testUser.premiumHistory.length > 0) {
      const lastEntry = testUser.premiumHistory[testUser.premiumHistory.length - 1];
      console.log(`   📋 Dernière entrée:`);
      console.log(`      - Accordé: ${lastEntry.grantedAt}`);
      console.log(`      - Expire: ${lastEntry.expiresAt}`);
      console.log(`      - Actif: ${lastEntry.isActive}`);
      console.log(`      - Accordé par: ${lastEntry.grantedBy}`);
    }

    // Attendre un peu puis révoquer
    console.log('\n📝 Étape 2: Révocation du premium...');
    testUser.revokePremium(adminUser._id);
    await testUser.save();
    
    // Recharger
    testUser = await User.findById(testUser._id);
    console.log(`   ✅ Premium révoqué`);
    console.log(`   🎭 Rôles: ${testUser.role}`);
    console.log(`   📚 Historique: ${testUser.premiumHistory?.length || 0} entrées`);
    
    if (testUser.premiumHistory && testUser.premiumHistory.length > 0) {
      testUser.premiumHistory.forEach((entry, index) => {
        console.log(`   📋 Entrée ${index + 1}:`);
        console.log(`      - Accordé: ${entry.grantedAt}`);
        console.log(`      - Expire: ${entry.expiresAt || 'jamais'}`);
        console.log(`      - Révoqué: ${entry.revokedAt || 'non'}`);
        console.log(`      - Actif: ${entry.isActive}`);
      });
    }

    // Test de getPremiumInfo
    console.log('\n🔍 Test getPremiumInfo():');
    const premiumInfo = testUser.getPremiumInfo();
    console.log(`   👑 A premium: ${premiumInfo.hasPremium}`);
    console.log(`   📚 Historique dans info: ${premiumInfo.history?.length || 0} entrées`);
    console.log(`   📅 Dernière attribution: ${premiumInfo.grantedAt}`);
    console.log(`   🚫 Révoqué le: ${premiumInfo.revokedAt || 'non'}`);

    console.log('\n✅ Test terminé !');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
  } finally {
    console.log('🔌 Déconnexion de MongoDB');
    await mongoose.disconnect();
  }
};

testPremiumHistory();