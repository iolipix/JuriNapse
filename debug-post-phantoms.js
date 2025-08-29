const axios = require('axios');

async function diagnosePostDeletionBehavior() {
    try {
        console.log('🔍 DIAGNOSTIC PRÉCIS - Comportement suppression posts\n');
        
        const baseURL = 'https://jurinapse-production.up.railway.app/api';
        
        // Test 1: État avant suppression
        console.log('📊 ÉTAPE 1: État initial');
        const initialState = await axios.get(`${baseURL}/posts`);
        console.log(`Posts visibles initialement: ${initialState.data.posts.length}`);
        
        initialState.data.posts.forEach((post, i) => {
            console.log(`  ${i+1}. "${post.title}" (ID: ${post._id.slice(-8)}...)`);
        });
        
        // Test 2: Simuler rapidement plusieurs suppressions pour voir le pattern
        console.log('\n🔄 ÉTAPE 2: Simulation de suppressions multiples');
        
        for (let cycle = 1; cycle <= 3; cycle++) {
            console.log(`\n--- Cycle ${cycle} ---`);
            
            // État avant
            const before = await axios.get(`${baseURL}/posts`);
            console.log(`Avant tentative: ${before.data.posts.length} posts`);
            
            // Tentative de suppression (va échouer mais on veut voir la réaction)
            if (before.data.posts.length > 0) {
                const testId = before.data.posts[0]._id;
                try {
                    await axios.delete(`${baseURL}/posts/${testId}`);
                    console.log('⚠️ Suppression réussie sans auth');
                } catch (e) {
                    console.log(`❌ Suppression bloquée: ${e.response?.status}`);
                }
            }
            
            // État immédiatement après
            const after = await axios.get(`${baseURL}/posts`);
            console.log(`Immédiatement après: ${after.data.posts.length} posts`);
            
            // Attendre un peu et retester
            await new Promise(resolve => setTimeout(resolve, 1000));
            const delayed = await axios.get(`${baseURL}/posts`);
            console.log(`Après 1 seconde: ${delayed.data.posts.length} posts`);
        }
        
        // Test 3: Vérifier les différences dans les réponses
        console.log('\n🔍 ÉTAPE 3: Analyse des variations de réponse');
        
        const responses = [];
        for (let i = 0; i < 5; i++) {
            const response = await axios.get(`${baseURL}/posts`);
            responses.push({
                count: response.data.posts.length,
                postIds: response.data.posts.map(p => p._id.slice(-8) + '...'),
                timestamp: new Date().toISOString().split('T')[1]
            });
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        console.log('Réponses successives:');
        responses.forEach((resp, i) => {
            console.log(`  ${i+1}. ${resp.count} posts à ${resp.timestamp}`);
            if (i > 0) {
                const different = resp.count !== responses[0].count;
                if (different) console.log(`     ⚠️ DIFFÉRENT de la première requête!`);
            }
        });
        
        // Test 4: Vérifier la base de données directement
        console.log('\n🎯 ÉTAPE 4: État réel de la base');
        try {
            const healthCheck = await axios.get(`${baseURL}/diagnostic/health`);
            console.log(`Base de données: ${healthCheck.data.database.posts} posts réels`);
            
            // Comparer avec l'API
            const apiCheck = await axios.get(`${baseURL}/posts`);
            console.log(`API GET /posts: ${apiCheck.data.posts.length} posts retournés`);
            
            if (healthCheck.data.database.posts !== apiCheck.data.posts.length) {
                console.log('⚠️ INCOHÉRENCE DÉTECTÉE entre base et API!');
                console.log('Possible cause: filtrage, population, ou requête mal formée');
            } else {
                console.log('✅ Cohérence base/API OK');
            }
        } catch (e) {
            console.log('❌ Impossible de vérifier la base directement');
        }
        
        console.log('\n💡 ANALYSE:');
        console.log('Si tu vois des posts "fantômes" qui apparaissent puis disparaissent:');
        console.log('1. 🔄 Le frontend affiche un état local obsolète');
        console.log('2. 🌐 Le backend retourne des données incohérentes');
        console.log('3. 📡 Il y a un délai de propagation');
        console.log('4. 🗂️ Le filtrage/population bug');
        
        console.log('\n🛠️ SOLUTIONS À TESTER:');
        console.log('1. Vide le cache navigateur complètement');
        console.log('2. Désactive JavaScript temporairement et réactive');
        console.log('3. Teste en navigation privée');
        console.log('4. Vérifie F12 > Network lors de la suppression');
        console.log('5. Regarde F12 > Application > Local Storage');
        
    } catch (error) {
        console.error('❌ Erreur diagnostic:', error.response?.data || error.message);
    }
}

// Test pour identifier si c'est un problème de cache frontend
async function testFrontendCaching() {
    console.log('\n🌐 TEST CACHE FRONTEND:');
    
    const baseURL = 'https://jurinapse-production.up.railway.app/api';
    
    try {
        // Même requête mais avec différents headers
        console.log('Test avec différents headers cache:');
        
        const normalRequest = await axios.get(`${baseURL}/posts`);
        console.log(`Normal: ${normalRequest.data.posts.length} posts`);
        
        const noCacheRequest = await axios.get(`${baseURL}/posts`, {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
        console.log(`No-cache: ${noCacheRequest.data.posts.length} posts`);
        
        const randomRequest = await axios.get(`${baseURL}/posts?_t=${Date.now()}`);
        console.log(`Random param: ${randomRequest.data.posts.length} posts`);
        
        if (normalRequest.data.posts.length !== noCacheRequest.data.posts.length) {
            console.log('⚠️ PROBLÈME CACHE HTTP détecté!');
        } else {
            console.log('✅ Pas de problème cache HTTP');
        }
        
    } catch (error) {
        console.log('❌ Erreur test cache frontend:', error.message);
    }
}

console.log('🚀 Diagnostic approfondi suppression posts...\n');

diagnosePostDeletionBehavior()
    .then(() => testFrontendCaching());
