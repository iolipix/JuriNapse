const mongoose = require('mongoose');
const User = require('./models/user.model.js');

// Configuration MongoDB
const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/lexilis';

async function verifyUsers() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(mongoUrl);

    console.log('✅ Connecté à MongoDB');

    const users = await User.find({});
    console.log(`\n📊 VÉRIFICATION - ${users.length} utilisateurs trouvés:`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. USERNAME: "${user.username}" | EMAIL: "${user.email}" | ID: ${user._id}`);
    });

    // Tentative de suppression forcée de test_user
    console.log('\n🔍 Recherche spécifique de test_user...');
    const testUser = await User.findOne({ username: 'test_user' });
    
    if (testUser) {
      console.log(`❗ test_user trouvé: ${testUser._id}`);
      console.log('🗑️ Suppression forcée...');
      
      const deleteResult = await User.deleteOne({ _id: testUser._id });
      console.log('Résultat suppression:', deleteResult);
      
      if (deleteResult.deletedCount > 0) {
        console.log('✅ test_user supprimé avec succès');
      } else {
        console.log('❌ Échec suppression test_user');
      }
    } else {
      console.log('✅ test_user non trouvé (déjà supprimé)');
    }

    // Vérification finale
    const finalUsers = await User.find({});
    console.log(`\n🎯 ÉTAT FINAL - ${finalUsers.length} utilisateur(s):`);
    finalUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user.email})`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔐 Déconnecté de MongoDB');
    process.exit(0);
  }
}

verifyUsers();
