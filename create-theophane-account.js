const axios = require('axios');

async function createTheophaneAccount() {
  try {
    console.log('🚀 Creating account for theophane.maurey@gmail.com...');
    
    const response = await axios.post('https://jurinapse-production.up.railway.app/api/auth/register', {
      firstName: 'Théophane',
      lastName: 'Maurey', 
      email: 'theophane.maurey@gmail.com',
      username: 'theophane',
      password: 'Theophane2005!',
      university: 'Université',
      graduationYear: 2025,
      isStudent: true
    });

    if (response.data.success) {
      console.log('✅ Account created successfully!');
      console.log('   📧 Email: theophane.maurey@gmail.com');
      console.log('   🔐 Password: Theophane2005!'); 
      console.log('   👤 Username: theophane');
      console.log('   ❌ Verified: false (par défaut)');
      console.log('');
      console.log('🎯 Maintenant testez la connexion avec ces identifiants');
      console.log('   Vous devriez être redirigé vers la page de vérification');
    }

  } catch (error) {
    if (error.response?.status === 400) {
      console.log('⚠️ Erreur 400:', error.response.data.message);
      
      if (error.response.data.message.includes('déjà utilisé')) {
        console.log('');
        console.log('🤔 Le compte existe déjà, mais avec un mot de passe différent');
        console.log('💡 Solutions:');
        console.log('   1. Utilisez le compte de test: test.verification@gmail.com / TestPassword123!');
        console.log('   2. Ou créons un compte avec un email légèrement différent');
      }
    } else {
      console.error('❌ Erreur inattendue:', error.response?.data || error.message);
    }
  }
}

createTheophaneAccount();
