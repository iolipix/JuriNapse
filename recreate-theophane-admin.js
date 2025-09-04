const axios = require('axios');

const BASE_URL = 'https://jurinapse-production.up.railway.app';

async function recreateTheophaneAdmin() {
  try {
    console.log('🔄 Recréation du compte admin theophane_mry...\n');
    
    // Utiliser la route admin pour recréer le compte avec l'ID exact
    const adminData = {
      action: 'recreate_theophane',
      adminId: '68b25c61a29835348429424a',
      userData: {
        username: 'theophane_mry',
        email: 'theophane.mry@gmail.com', // Utiliser l'email correct
        password: 'password123',
        firstName: 'Théophane',
        lastName: 'Mry',
        role: 'admin',
        isDeleted: false,
        canLogin: true,
        isEmailVerified: true
      }
    };
    
    console.log('📡 Envoi requête de recréation du compte admin...');
    
    try {
      // Tenter de créer via l'API admin
      const createResponse = await axios.post(`${BASE_URL}/api/admin/recreate-user`, adminData);
      console.log('✅ Compte recréé:', createResponse.data);
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('⚠️ Route admin non trouvée, tentative via inscription normale...');
        
        // Tentative via inscription normale
        const registerData = {
          email: 'theophane.mry@gmail.com',
          username: 'theophane_mry',
          password: 'password123',
          firstName: 'Théophane',
          lastName: 'Mry',
          university: 'École de Droit',
          graduationYear: 2027,
          isStudent: true,
          bio: 'Administrateur de JuriNapse'
        };
        
        const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, registerData);
        console.log('📝 Inscription:', registerResponse.data);
        
        if (registerResponse.data.success) {
          console.log('✅ Compte recréé via inscription !');
          
          // Maintenant le promouvoir admin
          console.log('🔐 Promotion au rôle admin...');
          
          // Ici nous aurions besoin de l'endpoint admin, mais créons un script de promote direct
        }
      } else {
        console.log('❌ Erreur création:', error.response?.data || error.message);
      }
    }
    
    // Test de connexion après recréation
    console.log('\n🔑 Test de connexion après recréation...');
    
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        emailOrPseudo: 'theophane_mry',
        password: 'password123'
      });
      
      console.log('✅ LOGIN RÉUSSI !');
      console.log('Token:', loginResponse.data.token ? 'Reçu' : 'Manquant');
      console.log('User:', {
        id: loginResponse.data.user?.id,
        username: loginResponse.data.user?.username,
        role: loginResponse.data.user?.role
      });
      
      // Test subscriptions
      if (loginResponse.data.token) {
        console.log('\n📱 Test subscriptions...');
        const subsResponse = await axios.get(`${BASE_URL}/api/subscriptions/`, {
          headers: { 'Authorization': `Bearer ${loginResponse.data.token}` }
        });
        console.log('✅ Subscriptions OK !', subsResponse.data);
      }
      
    } catch (loginError) {
      console.log('❌ Login échoué:', loginError.response?.data || loginError.message);
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

recreateTheophaneAdmin();
