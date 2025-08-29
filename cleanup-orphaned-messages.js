const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

// Modèles
const Message = require('./backend/models/message.model');
const Post = require('./backend/models/post.model');

async function cleanupOrphanedMessages() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    console.log('🔍 Recherche des messages avec des posts partagés...');
    
    // Trouver tous les messages qui ont des sharedPost
    const messagesWithSharedPosts = await Message.find({
      'sharedPost._id': { $exists: true }
    }).select('_id sharedPost._id authorId groupId createdAt');

    console.log(`📊 ${messagesWithSharedPosts.length} messages avec posts partagés trouvés`);

    if (messagesWithSharedPosts.length === 0) {
      console.log('✅ Aucun message avec post partagé trouvé');
      return;
    }

    // Récupérer tous les IDs des posts référencés
    const referencedPostIds = messagesWithSharedPosts.map(msg => msg.sharedPost._id);
    console.log(`🔍 Vérification de l'existence de ${referencedPostIds.length} posts référencés...`);

    // Vérifier quels posts existent encore
    const existingPosts = await Post.find({
      _id: { $in: referencedPostIds }
    }).select('_id');

    const existingPostIds = existingPosts.map(post => post._id.toString());
    console.log(`✅ ${existingPostIds.length} posts existent encore`);

    // Identifier les messages orphelins
    const orphanedMessages = messagesWithSharedPosts.filter(msg => 
      !existingPostIds.includes(msg.sharedPost._id.toString())
    );

    console.log(`🚨 ${orphanedMessages.length} messages orphelins détectés`);

    if (orphanedMessages.length === 0) {
      console.log('✅ Aucun message orphelin trouvé');
      return;
    }

    // Afficher quelques détails des messages orphelins
    console.log('📋 Détails des messages orphelins:');
    orphanedMessages.slice(0, 5).forEach((msg, index) => {
      console.log(`   ${index + 1}. Message ID: ${msg._id}, Post référencé: ${msg.sharedPost._id}, Groupe: ${msg.groupId}`);
    });

    // Demander confirmation (pour un script manuel)
    console.log(`\n❓ Voulez-vous supprimer ces ${orphanedMessages.length} messages orphelins ? (Cette action est irréversible)`);
    console.log('   Pour confirmer, relancez le script avec --confirm');

    if (!process.argv.includes('--confirm')) {
      console.log('🛑 Nettoyage annulé. Utilisez --confirm pour effectuer le nettoyage');
      return;
    }

    // Supprimer les messages orphelins
    const orphanedMessageIds = orphanedMessages.map(msg => msg._id);
    const deleteResult = await Message.deleteMany({
      _id: { $in: orphanedMessageIds }
    });

    console.log(`✅ ${deleteResult.deletedCount} messages orphelins supprimés`);
    console.log('🎉 Nettoyage terminé avec succès');

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('📝 Connexion MongoDB fermée');
    process.exit(0);
  }
}

cleanupOrphanedMessages();
