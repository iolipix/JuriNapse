/**
 * Test pour connaître le nombre total de décisions disponibles via l'API Judilibre
 */

const https = require('https');
const url = require('url');

async function getTotalDecisionsCount() {
  console.log('📊 Recherche du nombre total de décisions dans Judilibre');
  console.log('=====================================================');
  console.log('');

  // Test 1: Requête sans filtre pour obtenir le total
  await testGeneralSearch('Recherche générale', 'https://www.courdecassation.fr/cassation/judilibre/v1.0/export');
  
  // Test 2: Avec batch_size important pour voir le maximum
  await testGeneralSearch('Avec batch_size 1000', 'https://www.courdecassation.fr/cassation/judilibre/v1.0/export?batch_size=1000');
  
  // Test 3: Avec type=arret pour les arrêts seulement
  await testGeneralSearch('Arrêts seulement', 'https://www.courdecassation.fr/cassation/judilibre/v1.0/export?type=arret&batch_size=100');
  
  // Test 4: Avec type=qpc pour les QPC
  await testGeneralSearch('QPC seulement', 'https://www.courdecassation.fr/cassation/judilibre/v1.0/export?type=qpc&batch_size=100');
  
  // Test 5: Avec une date récente pour voir s'il y a des décisions récentes
  await testGeneralSearch('Décisions 2024', 'https://www.courdecassation.fr/cassation/judilibre/v1.0/export?date_start=2024-01-01&batch_size=100');
  
  // Test 6: Avec une date plus ancienne
  await testGeneralSearch('Décisions 2023', 'https://www.courdecassation.fr/cassation/judilibre/v1.0/export?date_start=2023-01-01&date_end=2023-12-31&batch_size=100');
  
  // Test 7: Test de l'endpoint stats s'il existe
  await testGeneralSearch('Endpoint stats', 'https://www.courdecassation.fr/cassation/judilibre/v1.0/stats');
  
  // Test 8: Avec query générique
  await testGeneralSearch('Query "*"', 'https://www.courdecassation.fr/cassation/judilibre/v1.0/export?query=*&batch_size=10');
}

async function testGeneralSearch(label, testUrl) {
  console.log(`🔍 ${label}:`);
  console.log(`   URL: ${testUrl}`);
  
  return new Promise((resolve) => {
    try {
      const parsedUrl = url.parse(testUrl);
      
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: parsedUrl.path,
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'JuriNapse/1.0 (Legal Research Platform)',
          'Accept-Language': 'fr-FR,fr;q=0.9',
          'Cache-Control': 'no-cache'
        },
        timeout: 15000
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          console.log(`   📊 Status: ${res.statusCode}`);
          console.log(`   📦 Taille réponse: ${data.length} caractères`);
          
          if (res.statusCode === 200) {
            if (data.includes('<html') || data.includes('window.location')) {
              console.log(`   ❌ Redirection HTML (API bloquée)`);
            } else {
              try {
                const jsonData = JSON.parse(data);
                console.log(`   ✅ JSON valide reçu !`);
                
                // Analyser la structure de réponse
                if (jsonData.total !== undefined) {
                  console.log(`   🎯 TOTAL: ${jsonData.total} décisions !`);
                }
                
                if (jsonData.results) {
                  console.log(`   📄 Résultats dans cette page: ${jsonData.results.length}`);
                  
                  if (jsonData.results.length > 0) {
                    console.log(`   📋 Premier résultat:`);
                    const first = jsonData.results[0];
                    console.log(`      ID: ${first.id || 'N/A'}`);
                    console.log(`      Date: ${first.decision_date || 'N/A'}`);
                    console.log(`      Type: ${first.type || 'N/A'}`);
                  }
                }
                
                if (jsonData.count !== undefined) {
                  console.log(`   📊 Count: ${jsonData.count}`);
                }
                
                // Afficher la structure si c'est différent
                const keys = Object.keys(jsonData);
                console.log(`   🔑 Clés disponibles: ${keys.join(', ')}`);
                
              } catch (e) {
                console.log(`   ❌ Erreur parsing JSON: ${e.message}`);
                console.log(`   📄 Début de la réponse: ${data.substring(0, 200)}...`);
              }
            }
          } else if (res.statusCode === 404) {
            console.log(`   ❌ Endpoint non trouvé`);
          } else {
            console.log(`   ❌ Erreur HTTP ${res.statusCode}`);
          }
          
          console.log('');
          resolve();
        });
      });

      req.on('error', (error) => {
        console.log(`   ❌ Erreur réseau: ${error.message}`);
        console.log('');
        resolve();
      });

      req.on('timeout', () => {
        req.destroy();
        console.log(`   ❌ Timeout`);
        console.log('');
        resolve();
      });

      req.end();
      
    } catch (error) {
      console.log(`   ❌ Erreur: ${error.message}`);
      console.log('');
      resolve();
    }
  });
}

getTotalDecisionsCount().then(() => {
  console.log('🎯 Résumé:');
  console.log('==========');
  console.log('Si toutes les requêtes retournent des redirections HTML,');
  console.log('cela confirme que l\'API Judilibre a des restrictions d\'accès.');
  console.log('');
  console.log('💡 Solutions possibles:');
  console.log('1. Demander une clé API officielle');
  console.log('2. Utiliser un service tiers ou scraper');
  console.log('3. Système hybride avec ajout manuel');
  console.log('4. Attendre que les restrictions soient levées');
});