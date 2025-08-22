const axios = require('axios');

async function emergencyDebugMultiplication() {
    try {
        console.log('🚨 DEBUG URGENCE - MULTIPLICATION x2 DES POSTS\n');
        
        const baseURL = 'https://jurinapse-production.up.railway.app/api';
        
        console.log('📊 ÉTAT ACTUEL APRÈS BUG x2:');
        const currentPosts = await axios.get(`${baseURL}/posts`);
        console.log(`Posts visibles: ${currentPosts.data.posts.length}`);
        
        // Analyser les doublons
        const postsByTitle = {};
        currentPosts.data.posts.forEach(post => {
            const key = `${post.title}_${post.authorId?.username}`;
            if (!postsByTitle[key]) {
                postsByTitle[key] = [];
            }
            postsByTitle[key].push({
                id: post._id.slice(-8),
                createdAt: post.createdAt
            });
        });
        
        console.log('\nAnalyse des doublons:');
        Object.entries(postsByTitle).forEach(([key, posts]) => {
            if (posts.length > 1) {
                console.log(`❌ "${key}": ${posts.length} exemplaires`);
                posts.forEach((p, i) => {
                    console.log(`   ${i+1}. ID: ...${p.id}, créé: ${new Date(p.createdAt).toLocaleString()}`);
                });
            } else {
                console.log(`✅ "${key}": ${posts.length} exemplaire (normal)`);
            }
        });
        
        console.log('\n🎯 PATTERN DÉTECTÉ:');
        console.log('- Tous les posts sauf le supprimé = x2 exemplaires');
        console.log('- Le post supprimé = reste 1 exemplaire');
        console.log('- C\'est exactement l\'inverse de ce qui devrait arriver !');
        
        console.log('\n🐛 CAUSE PROBABLE REACT:');
        console.log('Le code frontend fait quelque chose comme:');
        console.log('1. Suppression côté serveur réussie');
        console.log('2. React reçoit la confirmation');
        console.log('3. Au lieu de retirer le post de la liste:');
        console.log('   ❌ Il duplique TOUS les autres posts');
        console.log('   ❌ Et garde le post "supprimé" en 1 exemplaire');
        
        console.log('\n💡 BUG POSSIBLE:');
        console.log('setPosts([...posts.filter(p => p.id !== deletedId), ...posts])');
        console.log('Au lieu de:');
        console.log('setPosts(posts.filter(p => p.id !== deletedId))');
        
        console.log('\n🚨 SOLUTION D\'URGENCE:');
        console.log('1. 🧹 Nettoyer tous les doublons en base');
        console.log('2. 🚫 Désactiver temporairement la suppression frontend');
        console.log('3. 🔧 Forcer un reload complet après chaque action');
        
        console.log('\n⚡ ACTION IMMÉDIATE:');
        console.log('Je vais créer un script pour nettoyer les doublons en base');
        console.log('et proposer une solution de contournement.');
        
    } catch (error) {
        console.error('❌ Erreur debug urgence:', error.message);
    }
}

console.log('🚨 Debug urgence multiplication x2...\n');

emergencyDebugMultiplication();
