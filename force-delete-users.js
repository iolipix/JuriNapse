const mongoose = require('mongoose');

// Configuration MongoDB
const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/lexilis';

async function forceDeleteUsers() {
  try {
    console.log('🔗 Connexion directe à MongoDB...');
    await mongoose.connect(mongoUrl);

    const db = mongoose.connection.db;
    const collection = db.collection('users');

    console.log('✅ Connecté à MongoDB');

    // Lister tous les utilisateurs
    const users = await collection.find({}).toArray();
    console.log(`\n📊 ${users.length} utilisateurs trouvés:`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. "${user.username}" (${user.email}) - ID: ${user._id}`);
    });

    // Supprimer tous les utilisateurs SAUF theophane_mry
    console.log('\n🗑️ Suppression de tous les utilisateurs sauf theophane_mry...');
    
    const deleteResult = await collection.deleteMany({
      username: { $ne: 'theophane_mry' }
    });

    console.log(`✅ ${deleteResult.deletedCount} utilisateurs supprimés`);

    // Vérification finale
    const remainingUsers = await collection.find({}).toArray();
    console.log(`\n🎯 RÉSULTAT FINAL - ${remainingUsers.length} utilisateur(s) restant(s):`);
    
    remainingUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user.email})`);
    });

    if (remainingUsers.length === 1 && remainingUsers[0].username === 'theophane_mry') {
      console.log('\n🎉 SUCCÈS ! Seul theophane_mry reste dans la base de données.');
    } else {
      console.log('\n⚠️ Il reste encore des utilisateurs autres que theophane_mry');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔐 Déconnecté de MongoDB');
    process.exit(0);
  }
}

forceDeleteUsers();
