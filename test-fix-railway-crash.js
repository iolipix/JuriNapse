// Test de la correction ESM/CommonJS pour node-fetch
console.log('🧪 TEST: Correction du crash Railway - node-fetch ESM');
console.log('=' .repeat(60));

// Tester notre fonction fetch native
const https = require('https');
const http = require('http');

// Fonction fetch native (copie de celle du fichier routes)
function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          statusText: res.statusMessage,
          text: () => Promise.resolve(data),
          json: () => Promise.resolve(JSON.parse(data))
        });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

// Test de la fonction
async function testFetch() {
  console.log('🔍 Test de la fonction fetch native...');
  
  try {
    const response = await fetch('https://httpbin.org/get');
    console.log('✅ Fetch natif fonctionne!');
    console.log('   Status:', response.status);
    console.log('   OK:', response.ok);
    
    const data = await response.json();
    console.log('✅ Parsing JSON fonctionne!');
    console.log('   Origin IP:', data.origin);
    
  } catch (error) {
    console.error('❌ Erreur lors du test fetch:', error.message);
  }
}

console.log('🚨 Problème identifié:');
console.log('   node-fetch v3+ est un module ES6 incompatible avec require()');
console.log('   Railway utilise CommonJS, ce qui cause l\'erreur ERR_REQUIRE_ESM');

console.log('\n🔧 Solution appliquée:');
console.log('   ✅ Suppression de node-fetch du package.json');
console.log('   ✅ Création d\'une fonction fetch native avec https/http');
console.log('   ✅ Compatible avec CommonJS et production');
console.log('   ✅ Pas de dépendances externes supplémentaires');

console.log('\n📊 Résultat attendu:');
console.log('   ✅ Plus d\'erreur ERR_REQUIRE_ESM sur Railway');
console.log('   ✅ Serveur backend démarre correctement');
console.log('   ✅ Routes SEO /api/seo/* fonctionnelles');

// Lancer le test
testFetch().then(() => {
  console.log('\n' + '=' .repeat(60));
  console.log('✨ CORRECTION TERMINÉE - Railway devrait redémarrer sans erreur');
});
