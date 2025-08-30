const mongoose = require('mongoose');
const Post = require('./models/post.model');
const User = require('./models/user.model');

async function checkPosts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jurinapse');
    
    // Chercher l'utilisateur Théophane
    const user = await User.findOne({ 
      $or: [
        { username: 'theophane' },
        { email: { $regex: 'theo', $options: 'i' } }
      ]
    });
    
    if (!user) {
      console.log('❌ Utilisateur Théophane non trouvé');
      process.exit(1);
    }
    
    console.log('👤 Utilisateur trouvé:', user.username, '(' + user.email + ')');
    
    // Chercher ses posts
    const posts = await Post.find({ authorId: user._id })
      .sort({ createdAt: -1 })
      .limit(10);
    
    console.log('📊 Posts de', user.username + ':');
    posts.forEach((post, i) => {
      console.log(`${i+1}. ${post.content.substring(0, 50)}... - isPrivate: ${post.isPrivate}`);
    });
    
    const privateCount = posts.filter(p => p.isPrivate).length;
    const publicCount = posts.filter(p => !p.isPrivate).length;
    
    console.log('\n📈 Résumé:');
    console.log(`   Posts privés: ${privateCount}`);
    console.log(`   Posts publics: ${publicCount}`);
    console.log(`   Total: ${posts.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

checkPosts();
