const mongoose = require('mongoose');
require('dotenv').config({ path: 'config/.env' });

const User = require('./backend/models/user.model');

const diagnosePremiumData = async () => {
  try {
    console.log('🔍 Diagnostic des données premium...');
    
    // Se connecter avec une URI locale ou de test si disponible
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';
    console.log(`🔗 Tentative de connexion à: ${uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
    
    if (!process.env.MONGODB_URI) {
      console.log('⚠️  MONGODB_URI non trouvé dans .env, impossible de se connecter à la production');
      console.log('📋 Pour diagnostiquer la production:');
      console.log('   1. Utilisez Railway CLI: railway run node diagnose-premium.js');
      console.log('   2. Ou exécutez ce script directement sur Railway');
      return;
    }
    
    await mongoose.connect(uri);
    console.log('✅ Connecté à MongoDB');

    // Chercher test user spécifiquement
    const testUser = await User.findOne({ 
      $or: [
        { username: /test/i },
        { email: /test/i }
      ]
    });

    if (!testUser) {
      console.log('❌ Aucun utilisateur "test" trouvé');
      
      // Lister les utilisateurs avec données premium
      const usersWithPremium = await User.find({
        $or: [
          { premiumGrantedAt: { $exists: true, $ne: null } },
          { premiumGrantedBy: { $exists: true, $ne: null } },
          { premiumExpiresAt: { $exists: true, $ne: null } },
          { role: { $regex: 'premium' } }
        ]
      }).select('username email role premiumGrantedAt premiumGrantedBy premiumExpiresAt premiumHistory');
      
      console.log(`\n📊 Utilisateurs avec données premium (${usersWithPremium.length}):`);
      usersWithPremium.forEach(user => {
        console.log(`\n👤 ${user.username}:`);
        console.log(`   - Rôles: ${user.role}`);
        console.log(`   - Premium accordé: ${user.premiumGrantedAt || 'null'}`);
        console.log(`   - Expire: ${user.premiumExpiresAt || 'jamais'}`);
        console.log(`   - Accordé par: ${user.premiumGrantedBy || 'null'}`);
        console.log(`   - Historique: ${user.premiumHistory?.length || 0} entrées`);
      });
      
      return;
    }

    console.log(`\n🎯 Utilisateur trouvé: ${testUser.username}`);
    console.log(`   📧 Email: ${testUser.email}`);
    console.log(`   🎭 Rôles: ${testUser.role}`);
    console.log(`   👑 A premium: ${testUser.hasRole('premium')}`);
    console.log(`   📅 Premium accordé: ${testUser.premiumGrantedAt || 'null'}`);
    console.log(`   ⏰ Premium expire: ${testUser.premiumExpiresAt || 'jamais'}`);
    console.log(`   👤 Accordé par: ${testUser.premiumGrantedBy || 'null'}`);
    console.log(`   📚 Historique: ${testUser.premiumHistory?.length || 0} entrées`);

    if (testUser.premiumHistory && testUser.premiumHistory.length > 0) {
      console.log('\n📋 Détails de l\'historique:');
      testUser.premiumHistory.forEach((entry, index) => {
        console.log(`   ${index + 1}. Accordé: ${entry.grantedAt}`);
        console.log(`      Expire: ${entry.expiresAt || 'jamais'}`);
        console.log(`      Révoqué: ${entry.revokedAt || 'non'}`);
        console.log(`      Actif: ${entry.isActive}`);
        console.log(`      Par: ${entry.grantedBy}`);
      });
    }

    // Tester getPremiumInfo()
    const premiumInfo = testUser.getPremiumInfo();
    console.log('\n🔍 getPremiumInfo() retourne:');
    console.log(JSON.stringify(premiumInfo, null, 2));

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    console.log('🔌 Déconnexion de MongoDB');
    await mongoose.disconnect();
  }
};

diagnosePremiumData();