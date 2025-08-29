// Test direct depuis le frontend avec les vraies APIs
console.log('🔍 Test API getUserByUsername depuis le frontend...');

// Test getUserByUsername comme le fait le frontend
fetch('/api/users/username/theophane_mry')  // Utilise le proxy en développement
  .then(response => {
    console.log('📍 Status getUserByUsername:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('🔍 RÉPONSE getUserByUsername:', JSON.stringify(data, null, 2));
    console.log('🏫 University direct:', data.university);
    console.log('🏫 University dans user:', data.user?.university);
    console.log('🏫 University dans data:', data.data?.university);
  })
  .catch(error => {
    console.error('❌ Erreur getUserByUsername:', error);
  });

console.log('🔍 Test API getUserById depuis le frontend...');
  
// Test getUserById  
fetch('/api/users/6873b50c7eb846319aba1014')  // Utilise l'ID de theophane_mry
  .then(response => {
    console.log('📍 Status getUserById:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('🔍 RÉPONSE getUserById:', JSON.stringify(data, null, 2));
    console.log('🏫 University direct:', data.university);
    console.log('🏫 University dans user:', data.user?.university);
    console.log('🏫 University dans data:', data.data?.university);
  })
  .catch(error => {
    console.error('❌ Erreur getUserById:', error);
  });
