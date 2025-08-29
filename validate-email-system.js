// Script de validation complète du système après déploiement
const http = require('http');
const https = require('https');

const BASE_URL = process.argv[2] || 'http://localhost:5000';
const isHttps = BASE_URL.startsWith('https://');
const requestModule = isHttps ? https : http;

console.log(`🔍 Validation du système de vérification email sur: ${BASE_URL}\n`);

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'EmailVerificationValidator/1.0',
        ...options.headers
      }
    };

    const req = requestModule.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ 
            status: res.statusCode, 
            data: parsed,
            headers: res.headers 
          });
        } catch (e) {
          resolve({ 
            status: res.statusCode, 
            data: data,
            headers: res.headers 
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function validateSystem() {
  const results = [];

  try {
    // 1. Test du serveur principal
    console.log('1. 🏠 Test du serveur principal...');
    try {
      const homeTest = await makeRequest(`${BASE_URL}/`);
      if (homeTest.status === 200) {
        console.log('   ✅ Serveur principal répond');
        results.push('✅ Serveur principal OK');
      } else {
        console.log(`   ❌ Serveur principal erreur: ${homeTest.status}`);
        results.push(`❌ Serveur principal: ${homeTest.status}`);
      }
    } catch (error) {
      console.log('   ❌ Serveur principal inaccessible:', error.message);
      results.push('❌ Serveur principal inaccessible');
      return results; // Arrêter si le serveur ne répond pas
    }

    // 2. Test endpoint de vérification de statut
    console.log('\n2. 📊 Test endpoint verification-status...');
    try {
      const statusTest = await makeRequest(`${BASE_URL}/api/auth/verification-status?email=nonexistent@test.com`);
      if (statusTest.status === 404) {
        console.log('   ✅ Endpoint verification-status fonctionne (404 attendu)');
        results.push('✅ Endpoint verification-status OK');
      } else {
        console.log(`   ⚠️ Endpoint verification-status: ${statusTest.status}`);
        results.push(`⚠️ Verification-status: ${statusTest.status}`);
      }
    } catch (error) {
      console.log('   ❌ Endpoint verification-status erreur:', error.message);
      results.push('❌ Endpoint verification-status erreur');
    }

    // 3. Test endpoint send-verification (rate limiting)
    console.log('\n3. 📧 Test endpoint send-verification...');
    try {
      const sendTest = await makeRequest(`${BASE_URL}/api/auth/send-verification`, {
        method: 'POST',
        body: { email: 'test@example.com' }
      });
      
      if (sendTest.status === 200) {
        console.log('   ✅ Endpoint send-verification fonctionne');
        console.log(`   📤 Response: ${sendTest.data.message || 'Email envoyé'}`);
        results.push('✅ Endpoint send-verification OK');
      } else if (sendTest.status === 429) {
        console.log('   ✅ Rate limiting actif (429 Too Many Requests)');
        results.push('✅ Rate limiting actif');
      } else {
        console.log(`   ⚠️ Send-verification status: ${sendTest.status}`);
        results.push(`⚠️ Send-verification: ${sendTest.status}`);
      }
    } catch (error) {
      console.log('   ❌ Endpoint send-verification erreur:', error.message);
      results.push('❌ Endpoint send-verification erreur');
    }

    // 4. Test endpoint verify (avec token invalide)
    console.log('\n4. 🔐 Test endpoint verify...');
    try {
      const verifyTest = await makeRequest(`${BASE_URL}/api/auth/verify?token=invalid-token-test`);
      
      if (verifyTest.status === 302 || verifyTest.status === 301) {
        console.log('   ✅ Endpoint verify fonctionne (redirection attendue)');
        console.log(`   🔄 Redirection vers: ${verifyTest.headers.location || 'URL frontend'}`);
        results.push('✅ Endpoint verify OK');
      } else {
        console.log(`   ⚠️ Verify endpoint status: ${verifyTest.status}`);
        results.push(`⚠️ Verify endpoint: ${verifyTest.status}`);
      }
    } catch (error) {
      console.log('   ❌ Endpoint verify erreur:', error.message);
      results.push('❌ Endpoint verify erreur');
    }

    // 5. Test sans paramètres (validation des erreurs)
    console.log('\n5. ⚠️ Test validation des erreurs...');
    try {
      const errorTest = await makeRequest(`${BASE_URL}/api/auth/send-verification`, {
        method: 'POST',
        body: { email: '' }
      });
      
      if (errorTest.status === 400) {
        console.log('   ✅ Validation des erreurs fonctionne (400 Bad Request)');
        results.push('✅ Validation erreurs OK');
      } else {
        console.log(`   ⚠️ Validation erreur status: ${errorTest.status}`);
        results.push(`⚠️ Validation erreur: ${errorTest.status}`);
      }
    } catch (error) {
      console.log('   ❌ Test validation erreurs échoué:', error.message);
      results.push('❌ Validation erreurs échoué');
    }

    // 6. Test de la route resend-verification
    console.log('\n6. 🔄 Test endpoint resend-verification...');
    try {
      const resendTest = await makeRequest(`${BASE_URL}/api/auth/resend-verification`, {
        method: 'POST',
        body: { email: 'test@example.com' }
      });
      
      if ([200, 404, 429].includes(resendTest.status)) {
        console.log(`   ✅ Endpoint resend-verification fonctionne (${resendTest.status})`);
        results.push('✅ Endpoint resend-verification OK');
      } else {
        console.log(`   ⚠️ Resend-verification status: ${resendTest.status}`);
        results.push(`⚠️ Resend-verification: ${resendTest.status}`);
      }
    } catch (error) {
      console.log('   ❌ Endpoint resend-verification erreur:', error.message);
      results.push('❌ Endpoint resend-verification erreur');
    }

  } catch (globalError) {
    console.error('❌ Erreur globale:', globalError.message);
    results.push('❌ Erreur globale de validation');
  }

  // Résumé final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSUMÉ DE LA VALIDATION');
  console.log('='.repeat(60));
  
  const successCount = results.filter(r => r.startsWith('✅')).length;
  const warningCount = results.filter(r => r.startsWith('⚠️')).length;
  const errorCount = results.filter(r => r.startsWith('❌')).length;
  
  results.forEach(result => console.log(`   ${result}`));
  
  console.log(`\n📈 Score: ${successCount}/${results.length} endpoints fonctionnels`);
  console.log(`   ✅ Succès: ${successCount}`);
  console.log(`   ⚠️ Avertissements: ${warningCount}`);
  console.log(`   ❌ Erreurs: ${errorCount}`);
  
  if (errorCount === 0 && successCount >= 4) {
    console.log('\n🎉 SYSTÈME DE VÉRIFICATION EMAIL VALIDÉ !');
    console.log('   Le système est prêt pour la production.');
  } else if (errorCount <= 2) {
    console.log('\n⚠️ SYSTÈME PARTIELLEMENT FONCTIONNEL');
    console.log('   Quelques problèmes mineurs à corriger.');
  } else {
    console.log('\n❌ SYSTÈME NON FONCTIONNEL');
    console.log('   Des corrections importantes sont nécessaires.');
  }
  
  console.log(`\n🌐 URL testée: ${BASE_URL}`);
  console.log(`⏰ Test effectué le: ${new Date().toLocaleString()}`);
}

// Lancer la validation
validateSystem().catch(console.error);
