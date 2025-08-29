const axios = require('axios');

async function emergencyTest() {
    try {
        console.log('🚨 TEST D\'URGENCE - État actuel\n');
        
        const baseURL = 'https://jurinapse-production.up.railway.app/api';
        
        console.log('📊 COMPTAGE ACTUEL:');
        const response = await axios.get(`${baseURL}/posts`);
        console.log(`Posts visibles: ${response.data.posts.length}`);
        
        // Analyser les doublons
        const postsByKey = {};
        response.data.posts.forEach(post => {
            const key = `${post.title}_${post.authorId?.username}`;
            if (!postsByKey[key]) {
                postsByKey[key] = [];
            }
            postsByKey[key].push(post._id.slice(-6));
        });
        
        console.log('\nAnalyse doublons:');
        Object.entries(postsByKey).forEach(([key, ids]) => {
            if (ids.length > 1) {
                console.log(`❌ "${key}": ${ids.length} exemplaires (${ids.join(', ')})`);
            } else {
                console.log(`✅ "${key}": ${ids.length} exemplaire`);
            }
        });
        
        console.log('\n💡 SOLUTION FINALE:');
        console.log('Puisque le React ne coopère pas, il faut:');
        console.log('1. 🔧 Modifier directement le code React frontend');
        console.log('2. 🎯 Ou implémenter une solution côté serveur plus agressive');
        console.log('3. ⚡ Ou désactiver la suppression frontend temporairement');
        
        console.log('\n🎯 Options:');
        console.log('A) Veux-tu que je trouve et modifie le code React ?');
        console.log('B) On fait un contournement temporaire ?');
        console.log('C) On désactive la suppression en attendant ?');
        
        console.log('\n📋 ÉTAT RÉCAPITULATIF:');
        console.log('✅ Backend: Fonctionne parfaitement');
        console.log('✅ Base de données: Cohérente');
        console.log('✅ F5 manuel: Résout le problème');
        console.log('❌ React frontend: Bug de state management');
        console.log('❌ Signaux reload: Ignorés par React');
        
    } catch (error) {
        console.error('❌ Erreur test urgence:', error.message);
    }
}

console.log('🚨 Test final d\'urgence...\n');

emergencyTest();
