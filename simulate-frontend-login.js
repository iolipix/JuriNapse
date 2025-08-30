const axios = require('axios');

async function simulateFrontendLogin() {
  try {
    console.log('🎭 Simulating frontend login process...');
    console.log('📧 Email: test.verification@gmail.com');
    console.log('🔐 Password: TestPassword123!');
    console.log('');

    const response = await axios.post('https://jurinapse-production.up.railway.app/api/auth/login', {
      emailOrUsername: 'test.verification@gmail.com',
      password: 'TestPassword123!'
    });

    // Si on arrive ici, la connexion a réussi (inattendu)
    console.log('✅ Login successful (unexpected):', response.data);
    console.log('❌ PROBLÈME: L\'utilisateur non vérifié a pu se connecter');

  } catch (error) {
    console.log('❌ Login failed with status:', error.response?.status);
    
    const errorData = error.response?.data;
    const errorMessage = errorData?.message || '';
    const statusCode = error.response?.status;

    console.log('📄 Error data:', JSON.stringify(errorData, null, 2));
    console.log('');

    // Simulation de la logique AuthContext
    console.log('🧠 SIMULATING FRONTEND LOGIC:');
    
    if (statusCode === 403 && errorData?.requiresVerification) {
      console.log('✅ Condition matched: status 403 + requiresVerification');
      console.log('🔄 Setting needsEmailVerification = true');
      console.log('🎯 Setting pendingVerificationUserId = ', errorData?.userId || errorData?.email || 'test.verification@gmail.com');
      console.log('');
      console.log('🚀 FRONTEND SHOULD NOW:');
      console.log('   1. Close the auth form (useEffect in AuthForm)');
      console.log('   2. Show VerificationRequiredPage (useEffect in App.tsx)');
      console.log('   3. Display verification options');
      console.log('');
      console.log('✅ REDIRECTION DEVRAIT FONCTIONNER !');
    } else {
      console.log('❌ Condition not matched for redirection');
      console.log('   statusCode === 403?', statusCode === 403);
      console.log('   errorData?.requiresVerification?', !!errorData?.requiresVerification);
      
      // Fallback conditions
      if (errorData?.requiresVerification || errorData?.needsEmailVerification || errorMessage.includes('vérifi') || errorMessage.includes('activ')) {
        console.log('✅ Fallback condition matched - should still redirect');
        console.log('🔄 Setting needsEmailVerification = true anyway');
      } else {
        console.log('❌ No conditions matched - will show login error');
      }
    }
  }
}

simulateFrontendLogin();
