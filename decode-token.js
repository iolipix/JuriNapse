const jwt = require('jsonwebtoken');

// Décoder le token pour voir l'ID utilisateur qu'il contient
function decodeToken() {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGIyNWM2MWEyOTgzNTM0ODQyOTQyNGEiLCJpYXQiOjE3NTY5MzA5NTksImV4cCI6MTc1NzUzNTc1OX0.5y8oxSuQ_jq0t1Zmm-O3H-towevPyYvf9-SDhtH7Kqg';
  
  try {
    console.log('🔍 Décodage du token JWT...\n');
    
    // Décoder sans vérifier la signature (juste pour voir le contenu)
    const decoded = jwt.decode(token);
    console.log('Contenu du token:', JSON.stringify(decoded, null, 2));
    
    console.log('\n📋 Analyse:');
    console.log('- userId dans le token:', decoded?.userId);
    console.log('- ID attendu (MongoDB):', '68b25c61a29835348429424a');
    console.log('- Correspondance:', decoded?.userId === '68b25c61a29835348429424a' ? '✅ OUI' : '❌ NON');
    
    if (decoded?.userId !== '68b25c61a29835348429424a') {
      console.log('\n🎯 PROBLÈME TROUVÉ:');
      console.log('Le token contient un ancien ID utilisateur qui ne correspond plus !');
      console.log('Solutions:');
      console.log('1. Se déconnecter et se reconnecter pour obtenir un nouveau token');
      console.log('2. Ou corriger l\'ID dans la base de données');
    }
    
  } catch (error) {
    console.error('❌ Erreur décodage:', error.message);
  }
}

console.log('Instructions:');
console.log('1. Récupérez votre token depuis localStorage dans F12:');
console.log('   localStorage.getItem("jurinapse_token")');
console.log('2. Remplacez "REMPLACEZ_PAR_VOTRE_TOKEN" par votre vrai token');
console.log('3. Exécutez ce script');

decodeToken();
