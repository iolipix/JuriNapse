const mongoose = require('mongoose');
require('dotenv').config({ path: 'config/.env' });

const User = require('./backend/models/user.model');

const migrateSpecificUser = async (usernameOrEmail) => {
  try {
    console.log(`🎯 Migration premium pour utilisateur: ${usernameOrEmail}`);
    
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.log('⚠️  MONGODB_URI non trouvé. Exécutez sur Railway avec:');
      console.log(`   railway run node migrate-specific-user.js ${usernameOrEmail}`);
      return;
    }
    
    await mongoose.connect(uri);
    console.log('✅ Connecté à MongoDB');

    // Trouver l'utilisateur
    const user = await User.findOne({
      $or: [
        { username: usernameOrEmail },
        { email: usernameOrEmail },
        { username: { $regex: new RegExp(usernameOrEmail, 'i') } }
      ]
    });

    if (!user) {
      console.log(`❌ Utilisateur "${usernameOrEmail}" non trouvé`);
      return;
    }

    console.log(`\n👤 Utilisateur trouvé: ${user.username}`);
    console.log(`   🎭 Rôles: ${user.role}`);
    console.log(`   📅 Premium accordé: ${user.premiumGrantedAt || 'null'}`);
    console.log(`   ⏰ Premium expire: ${user.premiumExpiresAt || 'jamais'}`);
    console.log(`   👤 Accordé par: ${user.premiumGrantedBy || 'null'}`);
    console.log(`   📚 Historique actuel: ${user.premiumHistory?.length || 0} entrées`);

    // Vérifier s'il a des données premium à migrer
    const hasPremiumData = user.premiumGrantedAt || user.premiumGrantedBy || user.premiumExpiresAt;
    
    if (!hasPremiumData) {
      console.log('ℹ️  Aucune donnée premium à migrer');
      return;
    }

    // Vérifier s'il a déjà un historique
    if (user.premiumHistory && user.premiumHistory.length > 0) {
      console.log('ℹ️  L\'utilisateur a déjà un historique premium');
      
      // Afficher l'historique
      user.premiumHistory.forEach((entry, index) => {
        console.log(`   ${index + 1}. Accordé: ${entry.grantedAt}`);
        console.log(`      Expire: ${entry.expiresAt || 'jamais'}`);
        console.log(`      Révoqué: ${entry.revokedAt || 'non'}`);
        console.log(`      Actif: ${entry.isActive}`);
      });
      return;
    }

    console.log('\n🔄 Migration de l\'historique...');

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
        console.log('📅 Premium expiré, marqué dans l\'historique');
      } else {
        // Révoqué manuellement
        historyEntry.revokedAt = new Date();
        console.log('🚫 Premium révoqué, marqué dans l\'historique');
      }
      historyEntry.isActive = false;
    }

    // Ajouter l'entrée à l'historique
    user.premiumHistory = [historyEntry];
    
    await user.save();
    
    console.log('✅ Migration terminée !');
    console.log(`   📚 Historique créé avec 1 entrée`);
    console.log(`   🎯 Statut: ${historyEntry.isActive ? 'Actif' : 'Inactif'}`);
    
    // Vérifier le résultat
    const premiumInfo = user.getPremiumInfo();
    console.log('\n🔍 Informations premium après migration:');
    console.log(`   👑 A premium: ${premiumInfo.hasPremium}`);
    console.log(`   📊 Historique: ${premiumInfo.history?.length || 0} entrées`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    console.log('🔌 Déconnexion de MongoDB');
    await mongoose.disconnect();
  }
};

// Récupérer l'argument de ligne de commande
const targetUser = process.argv[2] || 'test';
migrateSpecificUser(targetUser);