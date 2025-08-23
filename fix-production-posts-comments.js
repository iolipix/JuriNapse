const { MongoClient } = require('mongodb');

// Configuration MongoDB pour la production
const PRODUCTION_MONGODB_URI = process.env.MONGODB_URI || 'YOUR_MONGODB_URI_HERE';
const dbName = 'jurinapse';

async function fixProductionPostsComments() {
  const client = new MongoClient(PRODUCTION_MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connecté à MongoDB de production');
    
    const db = client.db(dbName);
    
    // Trouver tous les posts qui ont des commentaires en tant que nombre
    const postsWithNumericComments = await db.collection('posts').find({
      comments: { $type: "number" }
    }).toArray();
    
    console.log(`🔍 Trouvé ${postsWithNumericComments.length} posts avec des commentaires numériques`);
    
    if (postsWithNumericComments.length === 0) {
      console.log('✅ Aucun post avec des commentaires numériques trouvé');
      return;
    }
    
    // Afficher les posts problématiques
    console.log('\n📋 Posts à corriger :');
    postsWithNumericComments.forEach(post => {
      console.log(`- ${post.title}: comments = ${post.comments} (${typeof post.comments})`);
    });
    
    // Mettre à jour tous les posts qui ont des commentaires en tant que nombre
    const updateResult = await db.collection('posts').updateMany(
      { comments: { $type: "number" } },
      { $set: { comments: [] } }
    );
    
    console.log(`\n✅ ${updateResult.modifiedCount} posts mis à jour avec des arrays de commentaires vides`);
    
    // Vérifier que la correction a fonctionné
    const remainingNumericComments = await db.collection('posts').countDocuments({
      comments: { $type: "number" }
    });
    
    if (remainingNumericComments === 0) {
      console.log('🎉 Tous les posts ont maintenant des commentaires en tant qu\'arrays !');
      console.log('✅ Le site jurinapse.com devrait maintenant fonctionner correctement');
    } else {
      console.log(`⚠️  Il reste encore ${remainingNumericComments} posts avec des commentaires numériques`);
    }
    
    // Afficher quelques posts pour vérification
    console.log('\n📋 Vérification - quelques posts après correction :');
    const samplePosts = await db.collection('posts').find({}).limit(3).toArray();
    samplePosts.forEach(post => {
      console.log(`- ${post.title}: comments = [${post.comments}] (${Array.isArray(post.comments) ? 'array' : typeof post.comments})`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction des posts:', error);
  } finally {
    await client.close();
  }
}

console.log('🔧 Correction des commentaires des posts en production...\n');
fixProductionPostsComments();
