const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function diagnosticPostsDatabase() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    const postsCollection = mongoose.connection.db.collection('posts');
    const usersCollection = mongoose.connection.db.collection('users');

    console.log('🔍 DIAGNOSTIC DE LA BASE DE DONNÉES');
    console.log('===================================\n');

    // 1. Compter les posts
    const totalPosts = await postsCollection.countDocuments();
    console.log(`📊 Total posts: ${totalPosts}`);

    // 2. Compter les utilisateurs
    const totalUsers = await usersCollection.countDocuments();
    console.log(`👥 Total utilisateurs: ${totalUsers}\n`);

    // 3. Vérifier les posts avec des authorId invalides
    console.log('🔍 Recherche de posts avec authorId invalide...');
    const postsWithAuthor = await postsCollection.find({}).limit(10).toArray();
    
    let invalidAuthorCount = 0;
    for (const post of postsWithAuthor) {
      try {
        if (post.authorId) {
          const author = await usersCollection.findOne({ _id: post.authorId });
          if (!author) {
            console.log(`❌ Post ${post._id} référence un utilisateur inexistant: ${post.authorId}`);
            invalidAuthorCount++;
          }
        }
      } catch (e) {
        console.log(`❌ Post ${post._id} a un authorId malformé: ${post.authorId}`);
        invalidAuthorCount++;
      }
    }
    
    if (invalidAuthorCount === 0) {
      console.log('✅ Tous les posts ont des authorId valides');
    } else {
      console.log(`🚨 ${invalidAuthorCount} posts avec authorId invalide détectés`);
    }
    console.log('');

    // 4. Vérifier les commentaires avec des authorId invalides
    console.log('🔍 Recherche de commentaires avec authorId invalide...');
    const postsWithComments = await postsCollection.find({ 
      'comments.0': { $exists: true } 
    }).limit(5).toArray();
    
    let invalidCommentAuthors = 0;
    for (const post of postsWithComments) {
      if (post.comments) {
        for (const comment of post.comments) {
          try {
            if (comment.authorId) {
              const author = await usersCollection.findOne({ _id: comment.authorId });
              if (!author) {
                console.log(`❌ Commentaire dans post ${post._id} référence un utilisateur inexistant: ${comment.authorId}`);
                invalidCommentAuthors++;
              }
            }
          } catch (e) {
            console.log(`❌ Commentaire dans post ${post._id} a un authorId malformé: ${comment.authorId}`);
            invalidCommentAuthors++;
          }
        }
      }
    }
    
    if (invalidCommentAuthors === 0) {
      console.log('✅ Tous les commentaires ont des authorId valides');
    } else {
      console.log(`🚨 ${invalidCommentAuthors} commentaires avec authorId invalide détectés`);
    }
    console.log('');

    // 5. Vérifier les posts récents
    console.log('📋 Les 5 posts les plus récents:');
    const recentPosts = await postsCollection.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
    
    for (const post of recentPosts) {
      const author = await usersCollection.findOne({ _id: post.authorId });
      console.log(`   📝 Post: ${post._id} | Auteur: ${author ? author.username : 'INEXISTANT'} | Date: ${post.createdAt}`);
    }

    console.log('\n🎯 RECOMMANDATIONS:');
    if (invalidAuthorCount > 0 || invalidCommentAuthors > 0) {
      console.log('⚠️ Il y a des références orphelines qui peuvent causer des erreurs 500');
      console.log('💡 Relancer ce script avec --fix pour nettoyer automatiquement');
    } else {
      console.log('✅ La base de données semble correcte');
      console.log('💡 Le problème vient probablement du middleware d\'authentification');
    }

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n📝 Connexion MongoDB fermée');
  }
}

diagnosticPostsDatabase();
