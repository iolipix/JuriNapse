const axios = require('axios');

async function debugPostIssue() {
    try {
        console.log('🔍 Debug approfondi du problème de suppression...');
        
        const baseURL = 'https://jurinapse-production.up.railway.app/api';
        
        // 1. Récupérer la liste des posts
        console.log('📊 Étape 1: Récupération liste posts...');
        const postsResponse = await axios.get(`${baseURL}/posts`);
        
        if (postsResponse.data.success) {
            console.log(`✅ ${postsResponse.data.posts.length} posts trouvés dans la réponse API`);
            
            // Vérifier chaque post individuellement
            console.log('\n🔍 Étape 2: Vérification individuelle de chaque post...');
            
            for (let i = 0; i < Math.min(postsResponse.data.posts.length, 5); i++) {
                const post = postsResponse.data.posts[i];
                console.log(`\n📄 Post ${i + 1}: ${post.title}`);
                console.log(`   ID: ${post._id}`);
                console.log(`   Auteur: ${post.authorId?.username || 'Inconnu'}`);
                
                // Vérifier son existence réelle en base
                try {
                    const checkResponse = await axios.get(`${baseURL}/diagnostic/check-post/${post._id}`);
                    console.log(`   ✅ Existe en base: ${checkResponse.data.exists}`);
                    
                    if (!checkResponse.data.exists) {
                        console.log('   ❌ PROBLÈME DÉTECTÉ: Post affiché mais n\'existe pas en base !');
                        console.log('   🔧 Cela explique les erreurs 404 lors de la suppression');
                    }
                } catch (checkError) {
                    console.log(`   ❌ Erreur vérification: ${checkError.message}`);
                }
            }
        }
        
        // 2. Vérifier s'il y a un problème de cache
        console.log('\n🗄️ Étape 3: Test de contournement du cache...');
        
        // Ajouter un paramètre random pour contourner le cache
        const noCacheResponse = await axios.get(`${baseURL}/posts?_t=${Date.now()}`);
        
        console.log(`📊 Réponse sans cache: ${noCacheResponse.data.posts.length} posts`);
        
        // 3. Comparer les réponses
        if (postsResponse.data.posts.length !== noCacheResponse.data.posts.length) {
            console.log('⚠️ DIFFÉRENCE DÉTECTÉE entre les réponses avec/sans cache !');
            console.log('🔧 Cela confirme un problème de cache côté serveur');
        } else {
            console.log('✅ Pas de différence - le cache n\'est pas la cause');
        }
        
    } catch (error) {
        console.error('❌ Erreur debug:', error.response?.data || error.message);
    }
}

// Test spécifique pour voir les headers de cache
async function testCacheHeaders() {
    try {
        console.log('🗄️ Test des headers de cache...');
        
        const response = await axios.get('https://jurinapse-production.up.railway.app/api/posts', {
            validateStatus: () => true // Accepter toutes les réponses
        });
        
        console.log('📋 Headers de réponse:');
        console.log('   Cache-Control:', response.headers['cache-control'] || 'Non défini');
        console.log('   ETag:', response.headers['etag'] || 'Non défini');
        console.log('   Last-Modified:', response.headers['last-modified'] || 'Non défini');
        
    } catch (error) {
        console.error('❌ Erreur test headers:', error.message);
    }
}

// Exécuter le debug
console.log('🚀 Début du debug approfondi...\n');

debugPostIssue().then(() => {
    console.log('\n🗄️ Test des headers de cache...');
    return testCacheHeaders();
}).then(() => {
    console.log('\n💡 SOLUTION RECOMMANDÉE:');
    console.log('Si des posts sont affichés mais n\'existent pas en base,');
    console.log('le problème vient probablement du cache serveur NodeCache.');
    console.log('Il faut vider le cache ou désactiver temporairement le cache.');
});
