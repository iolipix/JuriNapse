// Test rapide des deux APIs
async function testBothAPIs() {
  try {
    // Test getUserByUsername
    console.log('🔍 Test getUserByUsername...');
    const response1 = await fetch('https://jurinapse-production.up.railway.app/api/users/username/theophane_mry');
    const userData = await response1.json();
    
    console.log('✅ getUserByUsername Response:', {
      username: userData.username,
      firstName: userData.firstName,
      university: userData.university,
      isStudent: userData.isStudent
    });
    
    // Test getUserById avec l'ID récupéré
    const userId = userData._id || userData.id;
    console.log(`\n🔍 Test getUserById avec ID: ${userId}...`);
    
    const response2 = await fetch(`https://jurinapse-production.up.railway.app/api/users/${userId}`);
    const userByIdData = await response2.json();
    
    console.log('✅ getUserById Full Response:', userByIdData);
    
    // Extraire les bonnes données selon le format
    const actualUserData = userByIdData.user || userByIdData;
    
    console.log('✅ getUserById Actual Data:', {
      username: actualUserData.username,
      firstName: actualUserData.firstName,
      university: actualUserData.university,
      isStudent: actualUserData.isStudent,
      hasFirstName: !!actualUserData.firstName,
      hasUniversity: !!actualUserData.university
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testBothAPIs();
