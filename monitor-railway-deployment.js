const axios = require('axios');

async function waitForRailwayDeployment() {
    console.log('⏳ ATTENTE DU REDÉPLOIEMENT RAILWAY');
    console.log('==================================');
    console.log('🕐 Nos corrections Git ont été pushées');
    console.log('🚂 Railway se redéploie automatiquement...\n');
    
    const baseURL = 'https://jurinapse-production.up.railway.app';
    const maxAttempts = 20;
    const delayBetweenTests = 15000; // 15 secondes
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            console.log(`🔄 Test ${attempt}/${maxAttempts} (${new Date().toLocaleTimeString()})`);
            
            // Test simple de l'API pour voir si elle répond
            const healthResponse = await axios.get(`${baseURL}/api/messages/group/6877ada30f934e0b470cf524`, {
                params: { page: 1, limit: 1 },
                timeout: 10000,
                validateStatus: () => true // Accepter tous les codes de statut
            });
            
            console.log(`   📊 Status: ${healthResponse.status}`);
            
            if (healthResponse.status === 401) {
                console.log('   ✅ API fonctionne (erreur 401 = non authentifié, c\'est normal)');
                console.log('\n🎉 RAILWAY DÉPLOYÉ AVEC SUCCÈS !');
                console.log('💡 L\'erreur 500 devrait être corrigée maintenant');
                console.log('🔥 Testez maintenant dans votre navigateur !');
                return true;
                
            } else if (healthResponse.status === 500) {
                console.log('   ❌ Erreur 500 toujours présente');
                console.log('   📋 Response:', JSON.stringify(healthResponse.data, null, 2));
                
            } else if (healthResponse.status >= 200 && healthResponse.status < 300) {
                console.log('   ✅ API fonctionne parfaitement !');
                console.log('\n🎉 RAILWAY DÉPLOYÉ AVEC SUCCÈS !');
                return true;
                
            } else {
                console.log(`   ⚠️ Status inattendu: ${healthResponse.status}`);
            }
            
        } catch (error) {
            if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                console.log('   🚧 Railway en cours de redéploiement...');
            } else if (error.code === 'ECONNABORTED') {
                console.log('   ⏰ Timeout - serveur occupé ou en redéploiement');
            } else {
                console.log(`   ❓ Erreur: ${error.message}`);
            }
        }
        
        if (attempt < maxAttempts) {
            console.log(`   ⏳ Attente ${delayBetweenTests/1000}s avant le prochain test...\n`);
            await new Promise(resolve => setTimeout(resolve, delayBetweenTests));
        }
    }
    
    console.log('\n⚠️ TIMEOUT ATTEINT');
    console.log('Le redéploiement prend plus de temps que prévu.');
    console.log('💡 Vérifiez manuellement Railway Dashboard');
    console.log('🔗 https://railway.app');
    
    return false;
}

async function main() {
    console.log('🎯 SURVEILLANCE DU DÉPLOIEMENT RAILWAY');
    console.log('Correction erreur 500 API messages - Système utilisateur supprimé');
    console.log('====================================================================\n');
    
    const success = await waitForRailwayDeployment();
    
    if (success) {
        console.log('\n✅ DÉPLOIEMENT TERMINÉ AVEC SUCCÈS !');
        console.log('🧪 Recommandations de test:');
        console.log('1. Rafraîchir la page du groupe Droit L3 (Ctrl+F5)');
        console.log('2. Les messages devraient maintenant s\'afficher');
        console.log('3. Les anciens messages apparaîtront comme "Utilisateur Supprimé"');
    } else {
        console.log('\n❌ PROBLÈME DE DÉPLOIEMENT');
        console.log('🔧 Actions à effectuer:');
        console.log('1. Aller sur https://railway.app');
        console.log('2. Vérifier les logs de déploiement');
        console.log('3. Redéclencher manuellement si nécessaire');
    }
}

main();
