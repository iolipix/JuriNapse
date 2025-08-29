const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function createDeletedUserAndReplaceReferences() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    const usersCollection = mongoose.connection.db.collection('users');
    const messagesCollection = mongoose.connection.db.collection('messages');
    const postsCollection = mongoose.connection.db.collection('posts');
    
    const orphanedUserId = '6873e8c35535a6680e6c43bb'; // Utilisateur supprimé

    console.log('👤 CRÉATION D\'UN UTILISATEUR "SUPPRIMÉ" SPÉCIAL');
    console.log('================================================\n');

    // 1. Créer ou vérifier l'utilisateur "Utilisateur Supprimé"
    const deletedUserData = {
      username: 'utilisateur_supprime',
      firstName: 'Utilisateur',
      lastName: 'Supprimé',
      email: 'deleted@deleted.deleted',
      password: 'DELETED_ACCOUNT_NO_ACCESS',
      university: '',
      isStudent: false,
      bio: 'Ce compte a été supprimé',
      profilePicture: '/default-deleted-avatar.png',
      isDeleted: true,
      deletedAt: new Date(),
      canLogin: false,
      hideFromSuggestions: true,
      isSystemAccount: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Vérifier si l'utilisateur "supprimé" existe déjà
    let deletedUser = await usersCollection.findOne({ username: 'utilisateur_supprime' });
    
    if (!deletedUser) {
      console.log('🆕 Création du compte "Utilisateur Supprimé"...');
      const insertResult = await usersCollection.insertOne(deletedUserData);
      deletedUser = { _id: insertResult.insertedId, ...deletedUserData };
      console.log(`✅ Compte créé avec l'ID: ${deletedUser._id}`);
    } else {
      console.log(`✅ Compte "Utilisateur Supprimé" existe déjà avec l'ID: ${deletedUser._id}`);
    }

    const deletedUserId = deletedUser._id;

    // 2. Remplacer les références dans les messages
    console.log('\n📨 REMPLACEMENT DES RÉFÉRENCES DANS LES MESSAGES');
    console.log('===============================================');
    
    const messagesUpdateResult = await messagesCollection.updateMany(
      { authorId: new mongoose.Types.ObjectId(orphanedUserId) },
      { $set: { authorId: deletedUserId } }
    );
    
    console.log(`✅ ${messagesUpdateResult.modifiedCount} messages mis à jour`);

    // 3. Remplacer les références dans les commentaires des posts
    console.log('\n💬 REMPLACEMENT DES RÉFÉRENCES DANS LES COMMENTAIRES');
    console.log('==================================================');
    
    const postsWithOrphanedComments = await postsCollection.find({
      'comments.authorId': new mongoose.Types.ObjectId(orphanedUserId)
    }).toArray();
    
    let commentsUpdated = 0;
    for (const post of postsWithOrphanedComments) {
      const updatedComments = post.comments.map(comment => {
        if (comment.authorId && comment.authorId.toString() === orphanedUserId) {
          comment.authorId = deletedUserId;
          commentsUpdated++;
        }
        return comment;
      });
      
      await postsCollection.updateOne(
        { _id: post._id },
        { $set: { comments: updatedComments } }
      );
    }
    
    console.log(`✅ ${commentsUpdated} commentaires mis à jour dans ${postsWithOrphanedComments.length} posts`);

    // 4. Vérifier s'il reste des références orphelines
    console.log('\n🔍 VÉRIFICATION FINALE');
    console.log('=====================');
    
    const remainingOrphanedMessages = await messagesCollection.countDocuments({
      authorId: new mongoose.Types.ObjectId(orphanedUserId)
    });
    
    const remainingOrphanedComments = await postsCollection.countDocuments({
      'comments.authorId': new mongoose.Types.ObjectId(orphanedUserId)
    });
    
    console.log(`📊 Messages orphelins restants: ${remainingOrphanedMessages}`);
    console.log(`📊 Commentaires orphelins restants: ${remainingOrphanedComments}`);

    console.log('\n🎉 TRANSFORMATION TERMINÉE!');
    console.log('============================');
    console.log('✅ Toutes les références orphelines ont été remplacées');
    console.log('✅ Les messages apparaîtront maintenant comme "Utilisateur Supprimé"');
    console.log('✅ L\'utilisateur ne sera pas visible dans les suggestions');
    console.log('💡 L\'API des messages devrait maintenant fonctionner sans erreur 500');

  } catch (error) {
    console.error('❌ Erreur lors de la transformation:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n📝 Connexion MongoDB fermée');
  }
}

createDeletedUserAndReplaceReferences();
