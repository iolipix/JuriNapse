const axios = require('axios');

async function clearCacheAndTest() {
    try {
        console.log('🗄️ Vidage du cache serveur...');
        
        const baseURL = 'https://jurinapse-production.up.railway.app/api';
        
        // Vider le cache
        const clearResponse = await axios.post(`${baseURL}/diagnostic/clear-cache`);
        console.log('✅ Cache vidé:', clearResponse.data);
        
        // Attendre un peu
        console.log('⏳ Attente 2 secondes...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Retester la récupération des posts
        console.log('📊 Test récupération posts après vidage cache...');
        const postsResponse = await axios.get(`${baseURL}/posts`);
        console.log(`📄 Posts trouvés: ${postsResponse.data.posts.length}`);
        
        if (postsResponse.data.posts.length > 0) {
            console.log('✅ Posts récupérés avec succès !');
            postsResponse.data.posts.forEach((post, index) => {
                console.log(`${index + 1}. ${post.title} (${post.authorId?.username})`);
            });
        } else {
            console.log('⚠️ Aucun post trouvé - la base pourrait être vide');
        }
        
        // Vérifier l'état de la base directement
        console.log('\n🔍 Vérification santé après nettoyage...');
        const healthResponse = await axios.get(`${baseURL}/diagnostic/health`);
        console.log('📊 État base:', healthResponse.data.database);
        
    } catch (error) {
        console.error('❌ Erreur:', error.response?.data || error.message);
    }
}

// Test spécifique pour diagnostiquer pourquoi la publication ne marche pas
async function diagnosePublishingIssue() {
    try {
        console.log('\n🔍 Diagnostic spécifique de la publication...');
        
        const baseURL = 'https://jurinapse-production.up.railway.app/api';
        
        // Simuler exactement ce que fait le frontend
        console.log('📝 Simulation exacte de publication frontend...');
        
        const testPost = {
            type: 'article',
            title: 'Test Publication Diagnostic',
            content: 'Contenu de test pour diagnostiquer le problème de publication',
            tags: ['test'],
            isPrivate: false
        };
        
        // Test avec les headers exactes du frontend
        try {
            const publishResponse = await axios.post(`${baseURL}/posts`, testPost, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                    // Pas de token = erreur attendue
                }
            });
            console.log('⚠️ Publication réussie sans token (problème):', publishResponse.data);
        } catch (publishError) {
            console.log('Status:', publishError.response?.status);
            console.log('Message:', publishError.response?.data?.message);
            
            if (publishError.response?.status === 401) {
                console.log('✅ Authentification requise (normal)');
                console.log('🔧 Le problème côté frontend est probablement:');
                console.log('   - Token JWT expiré ou invalide');
                console.log('   - Cookies de session perdus');
                console.log('   - Problème de transmission du token');
            } else if (publishError.response?.status === 400) {
                console.log('❌ Erreur de validation:', publishError.response?.data);
            } else if (publishError.response?.status >= 500) {
                console.log('❌ Erreur serveur:', publishError.response?.data);
            }
        }
        
        // Test de connexion/inscription pour vérifier l'auth
        console.log('\n🔐 Test des routes d\'authentification...');
        try {
            const loginTestResponse = await axios.post(`${baseURL}/auth/login`, {
                email: 'test@example.com',
                password: 'wrongpassword'
            });
            console.log('⚠️ Login avec mauvais credentials réussi (problème)');
        } catch (loginError) {
            console.log('✅ Route login fonctionne:', loginError.response?.status, loginError.response?.data?.message);
        }
        
    } catch (error) {
        console.error('❌ Erreur diagnostic:', error.message);
    }
}

// Exécuter les tests
console.log('🚀 Début du diagnostic de publication...\n');

clearCacheAndTest()
    .then(() => diagnosePublishingIssue())
    .then(() => {
        console.log('\n💡 SOLUTION RECOMMANDÉE:');
        console.log('1. 🔄 Actualise complètement la page (Ctrl+F5)');
        console.log('2. 🔐 Vérifie que tu es bien connecté');
        console.log('3. 📋 Ouvre F12 > Console et regarde les erreurs lors de la publication');
        console.log('4. 🍪 Efface les cookies du site si nécessaire');
        console.log('5. 🔑 Reconnecte-toi si le token a expiré');
    });
