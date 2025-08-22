const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function cleanupOrphanedMessagesInGroup() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    const messagesCollection = mongoose.connection.db.collection('messages');
    const orphanedUserId = '6873e8c35535a6680e6c43bb'; // Utilisateur supprimé

    console.log('🧹 SUPPRESSION DES MESSAGES ORPHELINS DU GROUPE DROIT L3');
    console.log('=========================================================\n');

    // Supprimer tous les messages de cet utilisateur orphelin
    console.log(`🗑️ Suppression de tous les messages de l'utilisateur: ${orphanedUserId}`);
    
    const deleteResult = await messagesCollection.deleteMany({
      authorId: new mongoose.Types.ObjectId(orphanedUserId)
    });

    console.log(`✅ ${deleteResult.deletedCount} messages orphelins supprimés`);

    // Vérification finale - compter les messages restants dans le groupe
    const groupId = '6877ada30f934e0b470cf524';
    const remainingMessages = await messagesCollection.countDocuments({
      groupId: new mongoose.Types.ObjectId(groupId)
    });

    console.log(`📊 Messages restants dans le groupe Droit L3: ${remainingMessages}`);

    console.log('\n🎉 NETTOYAGE TERMINÉ!');
    console.log('💡 L\'API des messages du groupe devrait maintenant fonctionner sans erreur 500');

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n📝 Connexion MongoDB fermée');
  }
}

cleanupOrphanedMessagesInGroup();
