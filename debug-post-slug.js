// Script de diagnostic pour vérifier les slugs des posts
const mongoose = require('mongoose');
require('dotenv').config({ path: './config/.env' });

// Modèle Post
const Post = require('./backend/models/post.model');

const checkPostSlug = async () => {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Chercher un post qui pourrait correspondre au titre
    const posts = await Post.find({
      title: { $regex: /méthodologie.*cas.*pratique/i }
    }).select('_id title slug').limit(5);

    console.log(`\n📋 Posts trouvés (${posts.length}):`);
    posts.forEach(post => {
      console.log(`- ID: ${post._id}`);
      console.log(`  Titre: ${post.title}`);
      console.log(`  Slug: ${post.slug || 'AUCUN SLUG'}`);
      console.log(`  URL: /post/${post.slug || post._id}`);
      console.log('');
    });

    // Tester le slug spécifique mentionné
    const testSlug = 'la-methodologie-claire-du-cas-pratique-';
    console.log(`🔍 Test du slug problématique: "${testSlug}"`);
    
    const postBySlug = await Post.findOne({ slug: testSlug });
    if (postBySlug) {
      console.log(`✅ Post trouvé avec ce slug:`);
      console.log(`   Titre: ${postBySlug.title}`);
      console.log(`   ID: ${postBySlug._id}`);
    } else {
      console.log(`❌ Aucun post trouvé avec ce slug exact`);
      
      // Chercher des slugs similaires
      const similarSlugs = await Post.find({
        slug: { $regex: /methodologie.*cas.*pratique/i }
      }).select('_id title slug').limit(3);
      
      console.log(`\n🔍 Slugs similaires trouvés (${similarSlugs.length}):`);
      similarSlugs.forEach(post => {
        console.log(`- "${post.slug}" → ${post.title}`);
      });
    }

    // Vérifier aussi sans le tiret final
    const testSlugWithoutDash = testSlug.replace(/-$/, '');
    console.log(`\n🔍 Test sans tiret final: "${testSlugWithoutDash}"`);
    
    const postBySlugFixed = await Post.findOne({ slug: testSlugWithoutDash });
    if (postBySlugFixed) {
      console.log(`✅ Post trouvé sans le tiret final:`);
      console.log(`   Titre: ${postBySlugFixed.title}`);
      console.log(`   ID: ${postBySlugFixed._id}`);
      console.log(`   Slug actuel: "${postBySlugFixed.slug}"`);
    }

    mongoose.disconnect();
    console.log('\n🔚 Diagnostic terminé');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
};

checkPostSlug();
