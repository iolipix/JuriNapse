const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function forceCleanupOrphanedMessages() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Accès direct aux collections
    const messagesCollection = mongoose.connection.db.collection('messages');
    const postsCollection = mongoose.connection.db.collection('posts');

    console.log('🔍 Recherche des messages avec sharedPost...');
    
    // Trouver tous les messages qui ont un sharedPost
    const messagesWithSharedPost = await messagesCollection.find({
      'sharedPost._id': { $exists: true, $ne: null }
    }).toArray();

    console.log(`📊 ${messagesWithSharedPost.length} messages avec sharedPost trouvés`);

    if (messagesWithSharedPost.length === 0) {
      console.log('✅ Aucun message avec sharedPost trouvé');
      return;
    }

    // Récupérer tous les IDs des posts référencés
    const referencedPostIds = messagesWithSharedPost.map(msg => {
      // Gérer différents formats possibles de l'ID
      const postId = msg.sharedPost._id;
      if (typeof postId === 'string') {
        return new mongoose.Types.ObjectId(postId);
      } else if (postId instanceof mongoose.Types.ObjectId) {
        return postId;
      }
      return null;
    }).filter(id => id !== null);

    console.log(`🔍 Vérification de ${referencedPostIds.length} posts référencés...`);

    // Vérifier quels posts existent encore
    const existingPosts = await postsCollection.find({
      _id: { $in: referencedPostIds }
    }, { projection: { _id: 1 } }).toArray();

    const existingPostIdsStr = existingPosts.map(post => post._id.toString());
    console.log(`✅ ${existingPostIdsStr.length} posts existent encore`);

    // Identifier les messages orphelins
    const orphanedMessages = messagesWithSharedPost.filter(msg => {
      const postIdStr = msg.sharedPost._id.toString();
      return !existingPostIdsStr.includes(postIdStr);
    });

    console.log(`🚨 ${orphanedMessages.length} messages orphelins détectés`);

    if (orphanedMessages.length === 0) {
      console.log('✅ Aucun message orphelin trouvé');
      return;
    }

    // Afficher quelques détails
    console.log('📋 Premiers messages orphelins:');
    orphanedMessages.slice(0, 5).forEach((msg, index) => {
      console.log(`   ${index + 1}. Message: ${msg._id}, Post inexistant: ${msg.sharedPost._id}, Groupe: ${msg.groupId || 'N/A'}`);
    });

    console.log(`\n🗑️ SUPPRESSION FORCÉE de ${orphanedMessages.length} messages orphelins...`);

    // Supprimer les messages orphelins
    const orphanedMessageIds = orphanedMessages.map(msg => msg._id);
    const deleteResult = await messagesCollection.deleteMany({
      _id: { $in: orphanedMessageIds }
    });

    console.log(`✅ ${deleteResult.deletedCount} messages orphelins supprimés`);
    console.log('🎉 Nettoyage terminé avec succès');

    // Vérification finale
    const remainingOrphans = await messagesCollection.find({
      'sharedPost._id': { $exists: true, $ne: null }
    }).toArray();

    const stillOrphaned = [];
    for (const msg of remainingOrphans) {
      const postExists = await postsCollection.findOne({ _id: msg.sharedPost._id });
      if (!postExists) {
        stillOrphaned.push(msg);
      }
    }

    if (stillOrphaned.length > 0) {
      console.log(`⚠️ Il reste ${stillOrphaned.length} messages orphelins`);
    } else {
      console.log('✅ Plus aucun message orphelin détecté');
    }

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('📝 Connexion MongoDB fermée');
    process.exit(0);
  }
}

forceCleanupOrphanedMessages();
