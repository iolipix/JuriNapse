const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function cleanupOrphanedComments() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    const postsCollection = mongoose.connection.db.collection('posts');
    const usersCollection = mongoose.connection.db.collection('users');

    console.log('🧹 NETTOYAGE DES COMMENTAIRES ORPHELINS');
    console.log('=======================================\n');

    // Trouver tous les posts avec des commentaires
    const postsWithComments = await postsCollection.find({ 
      'comments.0': { $exists: true } 
    }).toArray();

    console.log(`📊 ${postsWithComments.length} posts avec commentaires trouvés`);

    let totalOrphanedComments = 0;
    let postsToUpdate = [];

    for (const post of postsWithComments) {
      if (post.comments && post.comments.length > 0) {
        const validComments = [];
        let orphanedInThisPost = 0;

        for (const comment of post.comments) {
          try {
            if (comment.authorId) {
              // Vérifier si l'utilisateur existe
              const author = await usersCollection.findOne({ _id: comment.authorId });
              if (author) {
                validComments.push(comment);
              } else {
                console.log(`❌ Commentaire orphelin détecté dans post ${post._id} - User: ${comment.authorId}`);
                orphanedInThisPost++;
                totalOrphanedComments++;
              }
            } else {
              // Commentaire sans authorId, garder quand même
              validComments.push(comment);
            }
          } catch (e) {
            console.log(`❌ Commentaire avec authorId malformé dans post ${post._id} - Error: ${e.message}`);
            orphanedInThisPost++;
            totalOrphanedComments++;
          }
        }

        // Si des commentaires orphelins ont été trouvés, préparer la mise à jour
        if (orphanedInThisPost > 0) {
          postsToUpdate.push({
            postId: post._id,
            originalComments: post.comments.length,
            cleanedComments: validComments.length,
            validComments: validComments
          });
          console.log(`   📝 Post ${post._id}: ${post.comments.length} → ${validComments.length} commentaires (${orphanedInThisPost} supprimés)`);
        }
      }
    }

    console.log(`\n📊 RÉSUMÉ:`);
    console.log(`   🗑️  ${totalOrphanedComments} commentaires orphelins détectés`);
    console.log(`   📝 ${postsToUpdate.length} posts à nettoyer`);

    if (totalOrphanedComments === 0) {
      console.log('\n✅ Aucun commentaire orphelin trouvé');
      return;
    }

    console.log(`\n🔧 NETTOYAGE EN COURS...`);

    // Mettre à jour tous les posts avec les commentaires nettoyés
    for (const updateData of postsToUpdate) {
      await postsCollection.updateOne(
        { _id: updateData.postId },
        { $set: { comments: updateData.validComments } }
      );
      console.log(`✅ Post ${updateData.postId} nettoyé`);
    }

    console.log(`\n🎉 NETTOYAGE TERMINÉ!`);
    console.log(`   ✅ ${totalOrphanedComments} commentaires orphelins supprimés`);
    console.log(`   ✅ ${postsToUpdate.length} posts mis à jour`);
    console.log(`\n💡 L'erreur "Erreur lors du chargement des posts" devrait maintenant être résolue`);

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n📝 Connexion MongoDB fermée');
  }
}

cleanupOrphanedComments();
