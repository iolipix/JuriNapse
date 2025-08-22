// Surveillance du déploiement Railway
console.log('🚀 Surveillance du redémarrage Railway...');
console.log('=' .repeat(50));

async function surveillerRailway() {
    const baseURL = 'https://juri-napse-backend-production-7de9.up.railway.app';
    let tentatives = 0;
    const maxTentatives = 10;
    
    while (tentatives < maxTentatives) {
        tentatives++;
        console.log(`\n🔍 Tentative ${tentatives}/${maxTentatives}`);
        
        try {
            const response = await fetch(baseURL, {
                timeout: 10000
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ API RÉPARÉE !', data.message);
                console.log('🎉 Railway a redémarré avec succès');
                
                // Test bonus: vérifier une route de messages
                try {
                    const testMessage = await fetch(`${baseURL}/api/messages/health`);
                    console.log(`📊 Test messages: ${testMessage.status}`);
                } catch (msgErr) {
                    console.log('ℹ️  Route messages encore en cours de redémarrage');
                }
                
                break;
            } else {
                console.log(`❌ Status: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.log(`⏳ Connexion échouée: ${error.message}`);
        }
        
        if (tentatives < maxTentatives) {
            console.log('⏱️  Attente 15 secondes...');
            await new Promise(resolve => setTimeout(resolve, 15000));
        }
    }
    
    if (tentatives >= maxTentatives) {
        console.log('\n⚠️  Temps d\'attente dépassé');
        console.log('📋 Vérifier manuellement les logs Railway');
    }
}

// Polyfill fetch si nécessaire (Node.js ancien)
if (typeof fetch === 'undefined') {
    global.fetch = require('node-fetch');
}

surveillerRailway().catch(console.error);
