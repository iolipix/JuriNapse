const axios = require('axios');

async function investigatePhantomPosts() {
    try {
        console.log('👻 INVESTIGATION POSTS FANTÔMES\n');
        
        const baseURL = 'https://jurinapse-production.up.railway.app/api';
        
        // Test 1: Créer un "instantané" de tous les posts actuels
        console.log('📸 INSTANTANÉ ACTUEL:');
        const currentPosts = await axios.get(`${baseURL}/posts`);
        console.log(`Posts actuellement visibles: ${currentPosts.data.posts.length}`);
        
        currentPosts.data.posts.forEach((post, i) => {
            console.log(`  ${i+1}. "${post.title}" par ${post.authorId?.username}`);
            console.log(`      ID: ${post._id}`);
            console.log(`      Créé: ${new Date(post.createdAt).toLocaleDateString()}`);
        });
        
        // Test 2: Forcer plusieurs requêtes avec des timestamps différents
        console.log('\n⏰ TEST COHÉRENCE TEMPORELLE:');
        const timestamps = [];
        
        for (let i = 0; i < 10; i++) {
            const response = await axios.get(`${baseURL}/posts?_bust=${Date.now()}`);
            timestamps.push({
                time: new Date().toISOString(),
                count: response.data.posts.length,
                titles: response.data.posts.map(p => p.title).join(', ')
            });
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log('Résultats sur 10 requêtes:');
        timestamps.forEach((t, i) => {
            console.log(`${i+1}. ${t.count} posts - "${t.titles}" à ${t.time.split('T')[1]}`);
        });
        
        // Vérifier s'il y a des variations
        const counts = timestamps.map(t => t.count);
        const titles = timestamps.map(t => t.titles);
        const uniqueCounts = [...new Set(counts)];
        const uniqueTitles = [...new Set(titles)];
        
        if (uniqueCounts.length > 1) {
            console.log(`⚠️ INSTABILITÉ: ${uniqueCounts.join(', ')} posts différents détectés`);
        }
        if (uniqueTitles.length > 1) {
            console.log('⚠️ POSTS VARIABLES détectés:');
            uniqueTitles.forEach((title, i) => console.log(`  Variant ${i+1}: "${title}"`));
        }
        if (uniqueCounts.length === 1 && uniqueTitles.length === 1) {
            console.log('✅ Stabilité parfaite côté serveur');
        }
        
        // Test 3: Vérifier le cache côté client avec différentes stratégies
        console.log('\n🌐 TEST STRATÉGIES ANTI-CACHE:');
        
        const strategies = [
            { name: 'Normal', headers: {} },
            { name: 'No-Cache', headers: { 'Cache-Control': 'no-cache' } },
            { name: 'No-Store', headers: { 'Cache-Control': 'no-store' } },
            { name: 'Must-Revalidate', headers: { 'Cache-Control': 'must-revalidate' } },
            { name: 'Max-Age-0', headers: { 'Cache-Control': 'max-age=0' } }
        ];
        
        for (const strategy of strategies) {
            try {
                const response = await axios.get(`${baseURL}/posts`, { headers: strategy.headers });
                console.log(`${strategy.name}: ${response.data.posts.length} posts`);
            } catch (e) {
                console.log(`${strategy.name}: ERREUR`);
            }
        }
        
        // Test 4: Identifier les posts supprimés récemment
        console.log('\n🗑️ ANALYSE SUPPRESSIONS RÉCENTES:');
        console.log('Posts que tu as peut-être supprimés récemment:');
        console.log('- "dd" (disparu du serveur)');
        console.log('- "ss" (disparu du serveur)');  
        console.log('- "ddd" (disparu du serveur)');
        console.log('- "sdfg" (disparu du serveur)');
        
        console.log('\n🔍 Ces posts apparaissent-ils temporairement dans ton navigateur ?');
        
        console.log('\n💡 DIAGNOSTIC:');
        console.log('Si tu vois des posts qui n\'existent plus côté serveur:');
        console.log('1. 🧠 React State: L\'état local garde les anciens posts');
        console.log('2. 🌐 Service Worker: Cache les anciennes réponses');
        console.log('3. 🍪 Local Storage: Stocke les anciens posts');
        console.log('4. 📱 App Cache: Cache application obsolète');
        
        console.log('\n🛠️ SOLUTIONS IMMÉDIATES:');
        console.log('1. Ctrl+Shift+Del > Tout supprimer');
        console.log('2. F12 > Application > Storage > Clear All');
        console.log('3. F12 > Application > Service Workers > Unregister');
        console.log('4. Teste en navigation privée');
        console.log('5. Désactive/réactive WiFi pour forcer refresh');
        
        console.log('\n🔧 SI PROBLÈME PERSISTE:');
        console.log('Le frontend React a probablement un bug de state management');
        console.log('Il faut regarder le code React qui gère la suppression');
        
    } catch (error) {
        console.error('❌ Erreur investigation:', error.response?.data || error.message);
    }
}

console.log('🚀 Investigation posts fantômes...\n');

investigatePhantomPosts();
