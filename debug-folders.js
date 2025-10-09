// Script de débogage pour les dossiers
const User = require('./backend/models/user.model');
const Folder = require('./backend/models/folder.model');
require('dotenv').config({ path: './config/.env' });

async function debugFolders() {
  try {
    console.log('🔍 Débogage des dossiers...\n');

    // 1. Vérifier l'utilisateur Théophane
    const user = await User.findOne({ email: 'theophane.aburey@gmail.com' });
    if (!user) {
      console.log('❌ Utilisateur Théophane non trouvé');
      return;
    }
    
    console.log('👤 Utilisateur trouvé:', {
      id: user._id,
      username: user.username,
      email: user.email
    });

    // 2. Lister tous ses dossiers
    const folders = await Folder.find({ owner: user._id }).populate('owner', 'username email');
    
    console.log(`\n📁 Dossiers trouvés: ${folders.length}`);
    
    folders.forEach((folder, index) => {
      console.log(`\n${index + 1}. ${folder.name}`);
      console.log(`   - ID: ${folder._id}`);
      console.log(`   - Parent: ${folder.parentId || 'Racine'}`);
      console.log(`   - Couleur: ${folder.color}`);
      console.log(`   - Public: ${folder.isPublic}`);
      console.log(`   - Créé: ${folder.createdAt}`);
      console.log(`   - Description: ${folder.description || 'Aucune'}`);
    });

    // 3. Vérifier la hiérarchie
    const rootFolders = folders.filter(f => !f.parentId);
    const childFolders = folders.filter(f => f.parentId);

    console.log(`\n🌳 Structure:`);
    console.log(`   - Dossiers racine: ${rootFolders.length}`);
    console.log(`   - Sous-dossiers: ${childFolders.length}`);

    // 4. Créer un dossier test si aucun n'existe
    if (folders.length === 0) {
      console.log('\n🛠️ Création d\'un dossier test...');
      
      const testFolder = new Folder({
        name: 'Test Debug Folder',
        description: 'Dossier créé pour le débogage',
        color: '#3B82F6',
        owner: user._id,
        isPublic: false
      });
      
      await testFolder.save();
      console.log('✅ Dossier test créé:', testFolder._id);
    }

    // 5. Vérifier les posts dans les dossiers
    const Post = require('./backend/models/post.model');
    for (const folder of folders) {
      const postsCount = await Post.countDocuments({ 
        author: user._id,
        folder: folder._id
      });
      console.log(`\n📄 Posts dans "${folder.name}": ${postsCount}`);
    }

    // 6. Vérifier tous les posts de l'utilisateur
    const allPosts = await Post.find({ author: user._id });
    console.log(`\n📄 Total posts de l'utilisateur: ${allPosts.length}`);
    
    const postsWithoutFolder = allPosts.filter(p => !p.folder);
    console.log(`📄 Posts sans dossier: ${postsWithoutFolder.length}`);

    console.log('\n✅ Débogage terminé !');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

debugFolders();