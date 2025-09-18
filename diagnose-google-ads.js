// 🔍 Script de diagnostic Google Ads - Vérification site
// Exécuter : railway run node diagnose-google-ads.js

const https = require('https');
const http = require('http');
const dns = require('dns').promises;

const SITE_URL = 'jurinapse.com';
const REQUIRED_FILES = [
  '/ads.txt',
  '/robots.txt',
  '/sitemap.xml'
];

const checkHTTP = (url) => {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data.substring(0, 500), // Premier 500 caractères
          redirected: res.statusCode >= 300 && res.statusCode < 400
        });
      });
    }).on('error', reject);
  });
};

const diagnoseGoogleAds = async () => {
  console.log('🔍 Diagnostic Google Ads - JuriNapse');
  console.log('=' + '='.repeat(50));
  
  try {
    // 1. Vérification DNS
    console.log('\n📡 Vérification DNS');
    try {
      const records = await dns.resolve4(SITE_URL);
      console.log(`✅ DNS A: ${records.join(', ')}`);
    } catch (error) {
      console.log(`❌ DNS Error: ${error.message}`);
    }

    // 2. Test des URLs principales
    console.log('\n🌐 Test d\'accessibilité');
    const urls = [
      `https://${SITE_URL}`,
      `https://www.${SITE_URL}`,
      `http://${SITE_URL}`,
      `http://www.${SITE_URL}`
    ];

    for (const url of urls) {
      try {
        console.log(`\n🔗 Testing: ${url}`);
        const result = await checkHTTP(url);
        console.log(`   Status: ${result.statusCode}`);
        console.log(`   Redirected: ${result.redirected}`);
        if (result.redirected && result.headers.location) {
          console.log(`   Location: ${result.headers.location}`);
        }
        console.log(`   Server: ${result.headers.server || 'Unknown'}`);
        console.log(`   Content-Length: ${result.headers['content-length'] || 'Unknown'}`);
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }

    // 3. Vérification des fichiers requis
    console.log('\n📄 Vérification fichiers requis');
    for (const file of REQUIRED_FILES) {
      try {
        const url = `https://${SITE_URL}${file}`;
        console.log(`\n📁 Checking: ${url}`);
        const result = await checkHTTP(url);
        console.log(`   Status: ${result.statusCode}`);
        if (result.statusCode === 200) {
          console.log(`   Content: ${result.data.substring(0, 200)}...`);
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }

    // 4. Recommandations
    console.log('\n💡 Recommandations pour Google AdSense:');
    console.log('1. Utiliser l\'URL principale qui répond en 200');
    console.log('2. S\'assurer que ads.txt est accessible');
    console.log('3. Vérifier que robots.txt n\'bloque pas Googlebot');
    console.log('4. Attendre 24-48h après correction');
    console.log('5. Re-soumettre l\'URL dans AdSense');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
};

// Exécution
diagnoseGoogleAds();