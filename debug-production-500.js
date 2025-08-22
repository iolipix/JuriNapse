const axios = require('axios');

async function deepTestProductionAPI() {
    console.log('🔍 DIAGNOSTIC APPROFONDI API PRODUCTION');
    console.log('=======================================');
    
    const baseURL = 'https://jurinapse-production.up.railway.app';
    const groupId = '6877ada30f934e0b470cf524';
    
    try {
        // Test 1: Sans paramètres pour voir la réponse
        console.log('1️⃣ Test API sans paramètres...');
        const response1 = await axios.get(`${baseURL}/api/messages/group/${groupId}`, {
            timeout: 15000,
            validateStatus: () => true
        });
        
        console.log(`   Status: ${response1.status}`);
        console.log(`   Headers: ${JSON.stringify(response1.headers)}`);
        console.log(`   Response: ${JSON.stringify(response1.data, null, 2)}`);
        
        // Test 2: Avec paramètres exactement comme le client
        console.log('\n2️⃣ Test avec paramètres page=1&limit=20...');
        const response2 = await axios.get(`${baseURL}/api/messages/group/${groupId}`, {
            params: { page: 1, limit: 20 },
            timeout: 15000,
            validateStatus: () => true
        });
        
        console.log(`   Status: ${response2.status}`);
        console.log(`   Response: ${JSON.stringify(response2.data, null, 2)}`);
        
        // Test 3: Vérifier les autres endpoints
        console.log('\n3️⃣ Test endpoint de base...');
        const response3 = await axios.get(`${baseURL}/api/health`, {
            timeout: 10000,
            validateStatus: () => true
        });
        
        console.log(`   Health Status: ${response3.status}`);
        
        // Test 4: Vérifier si le serveur redémarre constamment
        console.log('\n4️⃣ Test de stabilité (3 requêtes rapides)...');
        for (let i = 1; i <= 3; i++) {
            try {
                const quickTest = await axios.get(`${baseURL}/api/messages/group/${groupId}`, {
                    params: { page: 1, limit: 1 },
                    timeout: 5000,
                    validateStatus: () => true
                });
                console.log(`   Test ${i}: ${quickTest.status}`);
            } catch (error) {
                console.log(`   Test ${i}: ERROR - ${error.message}`);
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
    } catch (error) {
        console.error('❌ Erreur lors du diagnostic:', error.message);
        
        if (error.code === 'ECONNABORTED') {
            console.log('💡 Le serveur prend trop de temps à répondre');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('💡 Le serveur refuse les connexions');
        }
    }
}

// Également tester si Railway a bien déployé notre dernier commit
async function checkRailwayDeployment() {
    console.log('\n🚂 VÉRIFICATION DU DÉPLOIEMENT RAILWAY');
    console.log('=====================================');
    
    try {
        // Faire plusieurs tests pour voir si c'est consistant
        const tests = [];
        for (let i = 0; i < 5; i++) {
            tests.push(
                axios.get('https://jurinapse-production.up.railway.app/api/messages/group/6877ada30f934e0b470cf524', {
                    params: { page: 1, limit: 1 },
                    timeout: 8000,
                    validateStatus: () => true
                }).then(response => response.status).catch(error => error.code)
            );
        }
        
        const results = await Promise.all(tests);
        console.log('📊 Résultats des 5 tests rapides:', results);
        
        const errors500 = results.filter(r => r === 500).length;
        const errors401 = results.filter(r => r === 401).length;
        const errors = results.filter(r => typeof r === 'string').length;
        
        console.log(`   • Erreurs 500: ${errors500}/5`);
        console.log(`   • Erreurs 401: ${errors401}/5`);
        console.log(`   • Erreurs réseau: ${errors}/5`);
        
        if (errors500 > 0) {
            console.log('\n❌ CONFIRMATION: Erreur 500 persiste en production');
            console.log('💡 Railway n\'a pas correctement déployé nos corrections');
            console.log('🔧 Solutions possibles:');
            console.log('   1. Forcer un redéploiement Railway');
            console.log('   2. Vérifier les logs Railway pour voir les erreurs');
            console.log('   3. Le problème peut venir d\'une dépendance ou d\'une variable d\'environnement');
        } else if (errors401 > 0) {
            console.log('\n✅ Railway semble avoir déployé (erreurs 401 = normal sans auth)');
            console.log('💡 Mais votre navigateur voit encore du 500 - problème de cache ou autre');
        }
        
    } catch (error) {
        console.log('❌ Erreur pendant les tests:', error.message);
    }
}

async function main() {
    await deepTestProductionAPI();
    await checkRailwayDeployment();
    
    console.log('\n🎯 RECOMMANDATIONS FINALES:');
    console.log('1. Si les tests montrent du 500 : Railway n\'a pas déployé correctement');
    console.log('2. Si les tests montrent du 401 : Problème côté navigateur/cache');
    console.log('3. Vérifier Railway Dashboard : https://railway.app');
    console.log('4. Forcer un redéploiement manuel si nécessaire');
}

main();
