/**
 * Script pour accorder premium manuellement à Théophane via l'API
 */

const https = require('https');

async function grantPremiumToTheo() {
  // D'abord, on cherche l'ID de Théophane
  console.log('🔍 Recherche de l\'ID utilisateur de Théophane...');
  
  // On va essayer différents endpoints pour trouver l'ID
  const userEndpoints = [
    '/api/users/me', // Si on a une session
    '/api/debug/check-premium/admin' // Endpoint custom
  ];

  // Pour l'instant, utilisons un ID fictif - on va ajuster
  const potentialUserIds = [
    'admin', // Peut-être utilisé comme username
    'theophane',
    'theo'
  ];

  for (const userId of potentialUserIds) {
    console.log(`\n🧪 Test avec userId: ${userId}`);
    
    const postData = JSON.stringify({
      adminPassword: 'theo2024premium'
    });

    const options = {
      hostname: 'jurinapse.railway.app',
      port: 443,
      path: `/api/debug/manual-premium/${userId}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    try {
      const result = await makeRequest(options, postData);
      console.log(`✅ Succès avec ${userId}:`, result);
      break;
    } catch (error) {
      console.log(`❌ Échec avec ${userId}:`, error.message);
    }
  }
}

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(jsonData);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${jsonData.error || data}`));
          }
        } catch (e) {
          reject(new Error(`Invalid JSON response: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

// Alternative plus simple: créer un endpoint de recherche
async function findTheoAndGrantPremium() {
  console.log('🔍 Tentative de recherche et attribution premium...');
  
  const postData = JSON.stringify({
    action: 'find_and_grant_admin_premium',
    adminPassword: 'theo2024premium'
  });

  const options = {
    hostname: 'jurinapse.railway.app',
    port: 443,
    path: '/api/debug/fix-admin-premium',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  try {
    const result = await makeRequest(options, postData);
    console.log('✅ Premium accordé:', result);
  } catch (error) {
    console.log('❌ Erreur:', error.message);
  }
}

console.log('🚀 Tentative d\'attribution premium à Théophane...\n');

// Essayer les deux méthodes
grantPremiumToTheo().then(() => {
  console.log('\n🔄 Tentative alternative...');
  return findTheoAndGrantPremium();
}).then(() => {
  console.log('\n✅ Script terminé');
}).catch((error) => {
  console.error('❌ Erreur fatale:', error);
});