// Script à exécuter dans la console du navigateur (F12)
// Copie-colle ce code dans la console sur localhost:5173

console.log('🔍 DIAGNOSTIC TOKEN D\'AUTHENTIFICATION');
console.log('=======================================\n');

// 1. Vérifier le token dans localStorage
const token = localStorage.getItem('token');
console.log('1️⃣ Token dans localStorage:');
if (token) {
  console.log('✅ Token trouvé, longueur:', token.length);
  console.log('📋 Début du token:', token.substring(0, 50) + '...');
  
  // Essayer de décoder le token JWT
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      console.log('📅 Token expire le:', new Date(payload.exp * 1000));
      console.log('🕐 Maintenant:', new Date());
      console.log('⏰ Token expiré?', new Date(payload.exp * 1000) < new Date() ? '❌ OUI' : '✅ NON');
    }
  } catch (e) {
    console.log('❌ Erreur lors du décodage du token:', e.message);
  }
} else {
  console.log('❌ Aucun token trouvé');
}

// 2. Tester une requête authentifiée
console.log('\n2️⃣ Test d\'une requête authentifiée:');
fetch('http://localhost:5000/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('📡 Status de la requête /auth/me:', response.status);
  if (response.ok) {
    return response.json();
  } else {
    throw new Error(`Status ${response.status}: ${response.statusText}`);
  }
})
.then(data => {
  console.log('✅ Requête réussie, utilisateur:', data.user?.username);
})
.catch(error => {
  console.log('❌ Requête échouée:', error.message);
  console.log('💡 Solution: Se reconnecter pour obtenir un nouveau token');
});

// 3. Instructions
console.log('\n3️⃣ INSTRUCTIONS:');
console.log('Si le token est expiré ou la requête échoue:');
console.log('1. Se déconnecter et se reconnecter');
console.log('2. Ou exécuter: localStorage.removeItem("token") puis se reconnecter');
