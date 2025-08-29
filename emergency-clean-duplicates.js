const mongoose = require('mongoose');
require('dotenv').config();

async function emergencyCleanDuplicates() {
    try {
        console.log('🚨 NETTOYAGE D\'URGENCE DES DOUBLONS\n');
        
        // Connexion MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connexion MongoDB établie');
        
        const Post = mongoose.model('Post', new mongoose.Schema({}, { collection: 'posts', strict: false }));
        
        // Récupérer tous les posts
        const allPosts = await Post.find({}).sort({ createdAt: 1 });
        console.log(`📊 ${allPosts.length} posts trouvés en base`);
        
        // Grouper par titre + auteur + contenu
        const groups = {};
        allPosts.forEach(post => {
            const key = `${post.title}_${post.authorId}_${(post.content || '').substring(0, 50)}`;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(post);
        });
        
        // Trouver et supprimer les doublons
        let deletedCount = 0;
        for (const [key, posts] of Object.entries(groups)) {
            if (posts.length > 1) {
                console.log(`🔍 Groupe "${key}": ${posts.length} doublons détectés`);
                
                // Garder le plus ancien, supprimer les autres
                const toKeep = posts[0];
                const toDelete = posts.slice(1);
                
                console.log(`   Garder: ${toKeep._id} (créé: ${toKeep.createdAt})`);
                
                for (const duplicate of toDelete) {
                    console.log(`   Supprimer: ${duplicate._id} (créé: ${duplicate.createdAt})`);
                    await Post.findByIdAndDelete(duplicate._id);
                    deletedCount++;
                }
            }
        }
        
        console.log(`\n✅ Nettoyage terminé: ${deletedCount} doublons supprimés`);
        
        // Vérification finale
        const finalPosts = await Post.find({});
        console.log(`📊 ${finalPosts.length} posts restants en base`);
        
        // Afficher la liste finale
        console.log('\n📋 Posts restants:');
        finalPosts.forEach((post, i) => {
            console.log(`${i+1}. "${post.title}" par ${post.authorId} (${post._id.toString().slice(-8)}...)`);
        });
        
        await mongoose.disconnect();
        console.log('\n🔌 Connexion MongoDB fermée');
        
        console.log('\n🎯 PROCHAINES ÉTAPES:');
        console.log('1. Base nettoyée des doublons');
        console.log('2. Va sur jurinapse.fr');
        console.log('3. Fais F5 pour voir la liste propre');
        console.log('4. Teste une suppression');
        console.log('5. Si ça bug encore, on attaque le code React frontend');
        
    } catch (error) {
        console.error('❌ Erreur nettoyage:', error);
        process.exit(1);
    }
}

console.log('🚨 Lancement nettoyage d\'urgence...\n');

emergencyCleanDuplicates();
