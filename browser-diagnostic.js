/**
 * Script à exécuter dans la console du navigateur (F12) quand vous êtes connecté sur le site
 * pour diagnostiquer le problème d'authentification admin
 */

console.log('🔍 Diagnostic authentification admin - Copier ce code dans F12 console');

console.log(`
// 1️⃣ Vérifier les cookies et tokens
console.log('=== TOKENS ET COOKIES ===');
const token = localStorage.getItem('jurinapse_token');
console.log('Token localStorage:', token ? token.substring(0, 50) + '...' : 'Aucun');

// Vérifier les cookies
const cookies = document.cookie.split(';').reduce((acc, cookie) => {
  const [name, value] = cookie.trim().split('=');
  acc[name] = value;
  return acc;
}, {});
console.log('Cookies:', Object.keys(cookies).filter(k => k.includes('jurinapse')));

// 2️⃣ Vérifier l'utilisateur actuel
console.log('\\n=== UTILISATEUR ACTUEL ===');
// Si vous utilisez React DevTools, vous pouvez voir le context
console.log('Vérifiez dans React DevTools > AuthContext le user.role');

// 3️⃣ Test direct des API subscriptions
console.log('\\n=== TEST API SUBSCRIPTIONS ===');

const testAPI = async () => {
  try {
    const response = await fetch('/api/subscriptions', {
      credentials: 'include', // Important pour les cookies
      headers: {
        'Authorization': token ? \`Bearer \${token}\` : '',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', response.status);
    console.log('Headers:', [...response.headers.entries()]);
    
    const data = await response.json();
    console.log('Response:', data);
    
    if (response.status === 401) {
      console.log('❌ PROBLÈME: Token non valide ou expiré');
    } else if (response.status === 404) {
      console.log('❌ PROBLÈME: Route non trouvée');
    } else if (response.status === 200) {
      console.log('✅ API fonctionne !');
    }
    
  } catch (error) {
    console.error('❌ Erreur fetch:', error);
  }
};

testAPI();

console.log('\\n=== INSTRUCTIONS ===');
console.log('1. Connectez-vous sur le site avec votre compte admin');
console.log('2. Ouvrez F12 > Console');
console.log('3. Copiez et exécutez ce code');
console.log('4. Regardez les résultats pour voir où est le problème');
`);
