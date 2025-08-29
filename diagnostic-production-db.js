const { MongoClient } = require('mongodb');

// Configuration MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'YOUR_MONGODB_URI_HERE';
const dbName = 'jurinapse';

async function diagnosticDatabase() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connecté à MongoDB');
    
    const db = client.db(dbName);
    
    // Compter les utilisateurs
    const usersCount = await db.collection('users').countDocuments();
    console.log(`👥 Nombre total d'utilisateurs : ${usersCount}`);
    
    // Afficher quelques utilisateurs
    const users = await db.collection('users').find({}, { 
      projection: { username: 1, firstName: 1, lastName: 1, email: 1, createdAt: 1 } 
    }).limit(10).toArray();
    console.log('\n📋 Utilisateurs dans la base :');
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.username} (${user.firstName} ${user.lastName}) - ${user.email}`);
    });
    
    // Compter les posts
    const postsCount = await db.collection('posts').countDocuments();
    console.log(`\n📝 Nombre total de posts : ${postsCount}`);
    
    // Afficher quelques posts
    const posts = await db.collection('posts').find({}, { 
      projection: { title: 1, type: 1, createdAt: 1, authorId: 1 } 
    }).limit(10).toArray();
    console.log('\n📋 Posts dans la base :');
    posts.forEach((post, index) => {
      console.log(`  ${index + 1}. "${post.title}" (${post.type}) - Auteur: ${post.authorId}`);
    });
    
    // Vérifier les autres collections
    const collections = await db.listCollections().toArray();
    console.log('\n🗂️  Collections disponibles :');
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`  - ${collection.name}: ${count} documents`);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
  } finally {
    await client.close();
  }
}

diagnosticDatabase();
