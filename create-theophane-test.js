const axios = require('axios');

async function createTheophaneTest() {
  try {
    console.log('🚀 Creating test account with your name...');
    
    const response = await axios.post('https://jurinapse-production.up.railway.app/api/auth/register', {
      firstName: 'Théophane',
      lastName: 'Maurey', 
      email: 'theophane.test@gmail.com',
      username: 'theophane.test',
      password: 'Theophane2005!',
      university: 'Université',
      graduationYear: 2025,
      isStudent: true
    });

    console.log('✅ Account created successfully!');
    console.log('   📧 Email: theophane.test@gmail.com');
    console.log('   🔐 Password: Theophane2005!'); 
    console.log('   👤 Username: theophane.test');
    console.log('   ❌ Verified: false');
    console.log('');
    console.log('🎯 Testez maintenant avec ces identifiants');

  } catch (error) {
    console.log('❌ Erreur:', error.response?.data?.message || error.message);
  }
}

createTheophaneTest();
