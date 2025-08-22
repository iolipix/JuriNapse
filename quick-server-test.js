// Test API temporaire pour debug
const axios = require('axios');

async function quickTest() {
  try {
    console.log('🧪 Test rapide de l\'API...');
    
    // Test simple du serveur
    const response = await axios.get('https://jurinapse-production.up.railway.app/api/health');
    console.log('✅ Serveur actif');
    console.log('❌ Serveur pas actif ou pas de endpoint health');
  } catch (error) {
    console.log('Response status:', error.response?.status || 'No response');
    
    if (error.response?.status === 404) {
      console.log('✅ Serveur actif mais pas de endpoint /health');
    } else {
      console.log('❌ Problème serveur:', error.message);
    }
  }
}

quickTest();
