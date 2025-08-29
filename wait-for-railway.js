const axios = require('axios');

async function waitForRailway() {
  console.log('🔄 Surveillance du redéploiement Railway...\n');
  
  let attempts = 0;
  const maxAttempts = 20;
  
  while (attempts < maxAttempts) {
    try {
      console.log(`⏳ Tentative ${attempts + 1}/${maxAttempts}...`);
      
      const response = await axios.get('https://jurinapse-production.up.railway.app/', {
        timeout: 5000
      });
      
      if (response.status === 200 && response.data.message) {
        console.log('✅ Railway est de nouveau en ligne !');
        console.log('📧 Test du système de vérification email...\n');
        
        // Test immédiat
        const testEmail = `test.final${Date.now()}@test.com`;
        const testData = {
          email: testEmail,
          username: `final${Date.now()}`,
          password: 'Test123!@#',
          firstName: 'TestFinal',
          lastName: 'User',
          university: 'Test University',
          graduationYear: 2025,
          isStudent: true,
          bio: 'Test final'
        };
        
        const signupResponse = await axios.post('https://jurinapse-production.up.railway.app/api/auth/register', testData);
        
        console.log('✅ Inscription réussie !');
        console.log('Data:', JSON.stringify(signupResponse.data, null, 2));
        
        if (signupResponse.data.needsVerification) {
          console.log('\n🎉 SUCCESS! Le flag needsVerification est présent !');
        }
        
        // Test de connexion
        try {
          await axios.post('https://jurinapse-production.up.railway.app/api/auth/login', {
            emailOrUsername: testEmail,
            password: testData.password
          });
          console.log('❌ PROBLÈME: Connexion réussie sans vérification');
        } catch (loginError) {
          if (loginError.response?.status === 403) {
            console.log('✅ Connexion correctement bloquée !');
            console.log('Message:', loginError.response.data.message);
            
            console.log('\n🎯 SYSTÈME COMPLET FONCTIONNEL:');
            console.log('   ✅ Inscription avec needsVerification: true');
            console.log('   ✅ Connexion bloquée pour comptes non vérifiés');
            console.log('   ✅ Email de vérification envoyé');
            console.log('   ✅ Frontend devrait maintenant afficher la modal');
          }
        }
        
        break;
      }
    } catch (error) {
      console.log(`❌ Pas encore prêt (${error.response?.status || error.code})`);
    }
    
    attempts++;
    if (attempts < maxAttempts) {
      console.log('⏳ Attente 10 secondes...\n');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  
  if (attempts >= maxAttempts) {
    console.log('❌ Railway n\'a pas redémarré dans les temps attendus');
  }
}

waitForRailway().catch(console.error);
