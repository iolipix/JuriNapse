const mongoose = require('mongoose');
const User = require('./models/user.model.js');

// Configuration MongoDB
const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/lexilis';

async function cleanupSpecificTestUsers() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(mongoUrl);

    console.log('✅ Connecté à MongoDB');

    console.log('🔍 Recherche des utilisateurs...');
    const allUsers = await User.find({});
    console.log(`📊 ${allUsers.length} utilisateurs trouvés au total`);

    // Utilisateurs spécifiques à supprimer (tous sauf theophane_mry)
    const usersToDelete = [];
    const usersToKeep = [];

    allUsers.forEach(user => {
      const username = user.username || '';
      
      // Garder UNIQUEMENT theophane_mry
      if (username === 'theophane_mry') {
        usersToKeep.push(user);
      } else {
        // Supprimer tous les autres (test_user, alahuagbar, etc.)
        usersToDelete.push(user);
      }
    });

    console.log(`\n📋 ANALYSE DES UTILISATEURS:`);
    console.log(`✅ Utilisateurs à CONSERVER : ${usersToKeep.length}`);
    usersToKeep.forEach(user => {
      console.log(`   - ${user.username} (${user.email}) - ID: ${user._id}`);
    });

    console.log(`❌ Utilisateurs à SUPPRIMER : ${usersToDelete.length}`);
    usersToDelete.forEach(user => {
      console.log(`   - ${user.username} (${user.email}) - ID: ${user._id}`);
    });

    if (usersToDelete.length === 0) {
      console.log('✨ Aucun utilisateur à supprimer');
      return;
    }

    console.log(`\n⚠️  CONFIRMATION REQUISE`);
    console.log(`Vous êtes sur le point de supprimer ${usersToDelete.length} utilisateurs.`);
    console.log(`Seul "theophane_mry" sera conservé.`);
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const confirmation = await new Promise(resolve => {
      rl.question('\nTapez "SUPPRIMER" pour procéder : ', resolve);
    });
    rl.close();

    if (confirmation !== 'SUPPRIMER') {
      console.log('❌ Suppression annulée');
      return;
    }

    console.log('\n🗑️  Suppression des utilisateurs...');

    // Supprimer les utilisateurs un par un pour plus de sécurité
    let deletedCount = 0;
    for (const user of usersToDelete) {
      try {
        await User.deleteOne({ _id: user._id });
        console.log(`   ✅ Supprimé: ${user.username}`);
        deletedCount++;
      } catch (error) {
        console.log(`   ❌ Erreur suppression ${user.username}:`, error.message);
      }
    }

    console.log(`\n✅ ${deletedCount} utilisateurs supprimés avec succès`);

    // Vérification finale
    const remainingUsers = await User.find({});
    console.log(`\n📊 RÉSULTAT FINAL:`);
    console.log(`👥 ${remainingUsers.length} utilisateur(s) restant(s):`);
    remainingUsers.forEach(user => {
      console.log(`   - ${user.username} (${user.email})`);
    });

    console.log('\n🎉 Nettoyage terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔐 Déconnecté de MongoDB');
    process.exit(0);
  }
}

// Exécution
if (require.main === module) {
  cleanupSpecificTestUsers();
}

module.exports = { cleanupSpecificTestUsers };
