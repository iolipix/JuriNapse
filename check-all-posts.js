const mongoose = require('mongoose');
const Post = require('./models/post.model');

async function checkAllPosts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jurinapse');
    const totalPosts = await Post.countDocuments();
    console.log('📊 Total de posts dans la base:', totalPosts);
    
    if (totalPosts > 0) {
      const recentPosts = await Post.find()
        .populate('authorId', 'username')
        .sort({ createdAt: -1 })
        .limit(5);
        
      console.log('\n🔸 Posts récents:');
      recentPosts.forEach((post, i) => {
        console.log(`${i+1}. Par: ${post.authorId?.username || 'Utilisateur supprimé'}`);
        console.log(`   Contenu: ${post.content.substring(0, 50)}...`);
        console.log(`   Privé: ${post.isPrivate}`);
        console.log('');
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

checkAllPosts();
