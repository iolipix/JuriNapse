const axios = require('axios');

async function diagnoseCacheInconsistency() {
    try {
        console.log('🔍 DIAGNOSTIC AVANCÉ - Problème cache/synchronisation\n');
        
        const baseURL = 'https://jurinapse-production.up.railway.app/api';
        
        // Test 1: État initial
        console.log('📊 TEST 1: État initial');
        const initialHealth = await axios.get(`${baseURL}/diagnostic/health`);
        console.log(`Base de données: ${initialHealth.data.database.posts} posts, ${initialHealth.data.database.users} users`);
        
        const initialPosts = await axios.get(`${baseURL}/posts`);
        console.log(`API /posts: ${initialPosts.data.posts.length} posts visibles`);
        
        if (initialPosts.data.posts.length > 0) {
            initialPosts.data.posts.forEach((post, i) => {
                console.log(`  ${i+1}. "${post.title}" par ${post.authorId?.username || 'Inconnu'} (ID: ${post._id})`);
            });
        }
        
        // Test 2: Vider le cache et recompter
        console.log('\n🗑️ TEST 2: Vidage cache');
        await axios.post(`${baseURL}/diagnostic/clear-cache`);
        console.log('Cache vidé...');
        
        // Attendre un peu pour la propagation
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const afterClearPosts = await axios.get(`${baseURL}/posts`);
        console.log(`Après vidage cache: ${afterClearPosts.data.posts.length} posts visibles`);
        
        if (afterClearPosts.data.posts.length > 0) {
            afterClearPosts.data.posts.forEach((post, i) => {
                console.log(`  ${i+1}. "${post.title}" par ${post.authorId?.username || 'Inconnu'}`);
            });
        }
        
        // Test 3: Vérification directe base sans cache
        console.log('\n🎯 TEST 3: Requête directe base (bypass cache)');
        try {
            const directQuery = await axios.get(`${baseURL}/diagnostic/direct-posts-count`);
            console.log('Résultat requête directe:', directQuery.data);
        } catch (e) {
            console.log('Route directe non disponible, créons-la...');
        }
        
        // Test 4: Simulation rapide publication/suppression
        console.log('\n🔄 TEST 4: Cycle publication rapide');
        for (let i = 0; i < 3; i++) {
            console.log(`\n--- Cycle ${i+1} ---`);
            
            // Compter avant
            const beforePosts = await axios.get(`${baseURL}/posts`);
            console.log(`Avant: ${beforePosts.data.posts.length} posts`);
            
            // Vider cache
            await axios.post(`${baseURL}/diagnostic/clear-cache`);
            
            // Compter après vidage
            const afterClearTest = await axios.get(`${baseURL}/posts`);
            console.log(`Après vidage: ${afterClearTest.data.posts.length} posts`);
            
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Test 5: Vérifier les headers et le caching
        console.log('\n🌐 TEST 5: Headers et caching HTTP');
        const postsWithHeaders = await axios.get(`${baseURL}/posts`);
        console.log('Headers de réponse:');
        Object.keys(postsWithHeaders.headers).forEach(header => {
            if (header.includes('cache') || header.includes('etag') || header.includes('modified')) {
                console.log(`  ${header}: ${postsWithHeaders.headers[header]}`);
            }
        });
        
        console.log('\n💡 ANALYSE DES RÉSULTATS:');
        console.log('- Si les compteurs varient = problème de cache instable');
        console.log('- Si cache vidé ne change rien = problème de requête DB');
        console.log('- Si headers cache présents = conflit avec cache navigateur');
        console.log('- Si les posts apparaissent/disparaissent = race condition');
        
    } catch (error) {
        console.error('❌ Erreur diagnostic:', error.response?.data || error.message);
    }
}

// Test spécifique pour les race conditions
async function testRaceConditions() {
    try {
        console.log('\n⚡ TEST RACE CONDITIONS');
        
        const baseURL = 'https://jurinapse-production.up.railway.app/api';
        
        // Lancer plusieurs requêtes en parallèle
        console.log('🔄 Lancement 5 requêtes simultanées...');
        
        const promises = [];
        for (let i = 0; i < 5; i++) {
            promises.push(
                axios.get(`${baseURL}/posts`).then(response => ({
                    request: i + 1,
                    count: response.data.posts.length,
                    timestamp: new Date().toISOString()
                }))
            );
        }
        
        const results = await Promise.all(promises);
        
        console.log('Résultats des requêtes simultanées:');
        results.forEach(result => {
            console.log(`  Requête ${result.request}: ${result.count} posts à ${result.timestamp.split('T')[1]}`);
        });
        
        const counts = results.map(r => r.count);
        const uniqueCounts = [...new Set(counts)];
        
        if (uniqueCounts.length > 1) {
            console.log('⚠️ PROBLÈME DÉTECTÉ: Résultats incohérents entre requêtes simultanées!');
            console.log(`Comptages différents: ${uniqueCounts.join(', ')}`);
        } else {
            console.log('✅ Cohérence: Toutes les requêtes retournent le même nombre');
        }
        
    } catch (error) {
        console.error('❌ Erreur test race conditions:', error.message);
    }
}

console.log('🚀 Début diagnostic problème apparition/disparition posts...\n');

diagnoseCacheInconsistency()
    .then(() => testRaceConditions())
    .then(() => {
        console.log('\n🔧 SOLUTIONS POSSIBLES:');
        console.log('1. 🚫 Désactiver temporairement le cache NodeJS');
        console.log('2. 🔄 Ajouter des headers no-cache aux réponses API');
        console.log('3. 🎯 Implémenter une invalidation de cache plus précise');
        console.log('4. 🔒 Ajouter des mutex pour éviter les race conditions');
        console.log('5. 🌐 Vérifier les headers de cache HTTP du serveur');
    });
