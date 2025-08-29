const axios = require('axios');

async function cleanupOrphanPosts() {
    try {
        console.log('🧹 Nettoyage des posts orphelins...');
        
        const baseURL = 'https://jurinapse-production.up.railway.app/api';
        
        // Première étape : diagnostic seulement (sans suppression)
        console.log('🔍 Phase 1: Diagnostic des posts orphelins...');
        const diagnosticResponse = await axios.post(`${baseURL}/diagnostic/cleanup-orphan-posts`, {
            autoDelete: false // Ne pas supprimer, juste analyser
        });
        
        console.log('📊 Résultats du diagnostic:', diagnosticResponse.data);
        
        if (diagnosticResponse.data.orphansFound > 0) {
            console.log(`\n❌ ${diagnosticResponse.data.orphansFound} posts orphelins trouvés !`);
            console.log('🔧 Ces posts causent les erreurs 404 lors de la suppression');
            
            // Afficher quelques exemples
            if (diagnosticResponse.data.orphanPosts.length > 0) {
                console.log('\n📄 Exemples de posts orphelins:');
                diagnosticResponse.data.orphanPosts.forEach((post, index) => {
                    console.log(`${index + 1}. ${post.title} (ID: ${post.id})`);
                    console.log(`   Raison: ${post.reason}`);
                    console.log(`   Créé le: ${new Date(post.createdAt).toLocaleDateString()}`);
                });
            }
            
            // Proposer le nettoyage automatique
            console.log('\n🗑️ Phase 2: Nettoyage automatique...');
            const cleanupResponse = await axios.post(`${baseURL}/diagnostic/cleanup-orphan-posts`, {
                autoDelete: true // Maintenant supprimer
            });
            
            console.log('✅ Nettoyage terminé:', cleanupResponse.data);
            console.log(`🗑️ ${cleanupResponse.data.orphansDeleted} posts orphelins supprimés`);
            
        } else {
            console.log('✅ Aucun post orphelin trouvé - la base est propre !');
        }
        
    } catch (error) {
        console.error('❌ Erreur lors du nettoyage:', error.response?.data || error.message);
    }
}

// Nettoyage spécifique pour Théophane
async function cleanupTheophaneProfile() {
    try {
        console.log('🧹 Nettoyage du profil de Théophane...');
        
        const baseURL = 'https://jurinapse-production.up.railway.app/api';
        
        const cleanupResponse = await axios.post(`${baseURL}/diagnostic/cleanup-user-posts/theophane_mry`);
        
        console.log('✅ Nettoyage profil Théophane:', cleanupResponse.data);
        
    } catch (error) {
        console.error('❌ Erreur nettoyage Théophane:', error.response?.data || error.message);
    }
}

// Exécuter les nettoyages
console.log('🚀 Début du nettoyage complet...\n');

cleanupOrphanPosts().then(() => {
    console.log('\n👤 Nettoyage spécifique pour Théophane...');
    return cleanupTheophaneProfile();
}).then(() => {
    console.log('\n🎉 Nettoyage terminé !');
    console.log('🔄 Actualise la page web - les erreurs 404 devraient disparaître');
});
