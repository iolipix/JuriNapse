const axios = require('axios');

const BASE_URL = 'https://jurinapse-production.up.railway.app';

async function diagnosticTheophaneAccount() {
  try {
    console.log('🔍 Diagnostic complet du compte theophane_mry...\n');
    
    // Utiliser la route de diagnostic que j'ai créée dans le backend
    console.log('📊 Récupération des données du compte via API diagnostic...');
    
    try {
      // Créer une route de diagnostic temporaire pour voir les données
      const diagnosticResponse = await axios.get(`${BASE_URL}/api/diagnostic/user-info/theophane_mry`);
      console.log('✅ Données trouvées:', JSON.stringify(diagnosticResponse.data, null, 2));
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('❌ Compte theophane_mry introuvable dans la base !');
        
        // Tester avec l'ID direct
        try {
          const idResponse = await axios.get(`${BASE_URL}/api/diagnostic/user-info/68b25c61a29835348429424a`);
          console.log('✅ Compte trouvé par ID:', JSON.stringify(idResponse.data, null, 2));
        } catch (idError) {
          console.log('❌ Compte introuvable même par ID');
        }
      } else {
        console.log('❌ Erreur diagnostic:', error.response?.data || error.message);
      }
    }
    
    console.log('\n' + '='.repeat(50));
    
    // Test avec différents mots de passe possibles
    console.log('\n🔑 Test avec différents mots de passe:');
    const passwords = ['password123', 'admin123', 'theophane123', 'motdepasse'];
    
    for (const password of passwords) {
      try {
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
          emailOrPseudo: 'theophane_mry',
          password: password
        });
        console.log(`✅ LOGIN RÉUSSI avec mot de passe: ${password}`);
        break;
      } catch (error) {
        console.log(`❌ Échec avec: ${password}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

diagnosticTheophaneAccount();
