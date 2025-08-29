const axios = require('axios');

async function reproducePostMultiplicationBug() {
    try {
        console.log('🐛 REPRODUCTION DU BUG DE MULTIPLICATION DES POSTS\n');
        
        const baseURL = 'https://jurinapse-production.up.railway.app/api';
        
        // Test 1: État actuel exact
        console.log('📊 ÉTAT ACTUEL (comme sur ta capture):');
        const currentPosts = await axios.get(`${baseURL}/posts`);
        console.log(`Posts visibles: ${currentPosts.data.posts.length}`);
        
        const postsByTitle = {};
        currentPosts.data.posts.forEach(post => {
            const title = post.title;
            if (!postsByTitle[title]) {
                postsByTitle[title] = [];
            }
            postsByTitle[title].push({
                id: post._id.slice(-8) + '...',
                date: new Date(post.createdAt).toLocaleString()
            });
        });
        
        console.log('\nRépartition par titre:');
        Object.entries(postsByTitle).forEach(([title, posts]) => {
            console.log(`"${title}": ${posts.length} exemplaire(s)`);
            posts.forEach((post, i) => {
                console.log(`   ${i+1}. ID: ${post.id}, créé: ${post.date}`);
            });
        });
        
        // Test 2: Vérification de duplication
        const titles = currentPosts.data.posts.map(p => p.title);
        const uniqueTitles = [...new Set(titles)];
        const hasDuplicates = titles.length !== uniqueTitles.length;
        
        if (hasDuplicates) {
            console.log('\n⚠️ DUPLICATION DÉTECTÉE !');
            uniqueTitles.forEach(title => {
                const count = titles.filter(t => t === title).length;
                if (count > 1) {
                    console.log(`   "${title}": ${count} exemplaires`);
                }
            });
        } else {
            console.log('\n✅ Pas de duplication côté serveur');
        }
        
        // Test 3: Vérification des IDs uniques
        console.log('\n🆔 VÉRIFICATION IDS:');
        const ids = currentPosts.data.posts.map(p => p._id);
        const uniqueIds = [...new Set(ids)];
        
        if (ids.length !== uniqueIds.length) {
            console.log('⚠️ PROBLÈME: Même ID utilisé plusieurs fois !');
            const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
            console.log('IDs dupliqués:', duplicateIds);
        } else {
            console.log('✅ Tous les IDs sont uniques');
        }
        
        // Test 4: Chronologie des créations
        console.log('\n⏰ CHRONOLOGIE DES POSTS:');
        const sortedPosts = currentPosts.data.posts
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        
        sortedPosts.forEach((post, i) => {
            const date = new Date(post.createdAt);
            console.log(`${i+1}. "${post.title}" - ${date.toLocaleString()} (${post._id.slice(-6)}...)`);
        });
        
        // Test 5: Simulation du problème React
        console.log('\n🔍 ANALYSE DU PROBLÈME REACT:');
        console.log('Ton problème ressemble à:');
        console.log('1. 🎯 Tu crées 3 posts "gg"');
        console.log('2. 🗑️ Tu supprimes 1 post');
        console.log('3. ⚡ React ne met pas à jour correctement la liste');
        console.log('4. 🐛 Au lieu de retirer le post, il le duplique ou affiche mal');
        console.log('5. 🔄 F5 force un rechargement = affichage correct');
        
        console.log('\n💡 CAUSE PROBABLE:');
        console.log('Le code React qui gère la suppression fait quelque chose comme:');
        console.log('❌ posts.filter(p => p.id !== deletedId) // MAIS utilise le mauvais ID');
        console.log('❌ setPosts([...posts, ...newPosts]) // AJOUTE au lieu de REMPLACER');
        console.log('❌ State mis à jour avant confirmation serveur');
        
        console.log('\n🛠️ SOLUTIONS:');
        console.log('1. 🧹 Vide complètement le cache navigateur');
        console.log('2. 🔄 Force refresh après chaque suppression');
        console.log('3. 🚫 Désactive JavaScript temporairement');
        console.log('4. 📱 Teste en navigation privée');
        
        console.log('\n⚡ TEST IMMÉDIAT:');
        console.log('1. Supprime tous tes posts "gg"');
        console.log('2. Fais F5 après chaque suppression');
        console.log('3. Regarde si le problème persiste');
        
        // Test 6: Recommandations de debugging
        console.log('\n🔧 POUR DÉBUGGER LE REACT:');
        console.log('1. F12 > Console > Regarde les erreurs');
        console.log('2. F12 > Network > Vois les requêtes DELETE');
        console.log('3. F12 > React DevTools > État des composants');
        console.log('4. Vérifie que chaque DELETE retourne status 200');
        
    } catch (error) {
        console.error('❌ Erreur reproduction bug:', error.response?.data || error.message);
    }
}

console.log('🚀 Reproduction du bug de multiplication...\n');

reproducePostMultiplicationBug();
