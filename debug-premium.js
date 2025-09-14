// Script de debug pour tester les paramètres premium
console.log('=== DEBUG SETTINGS PREMIUM ===');

// Vérifier le localStorage
const token = localStorage.getItem('jurinapse_token');
console.log('Token présent:', !!token);
if (token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('User ID du token:', payload.userId);
    console.log('Token expiré:', Date.now() / 1000 > payload.exp);
  } catch (e) {
    console.log('Erreur parsing token:', e);
  }
}

// Tester l'endpoint premium-info
if (token) {
  fetch('/api/users/premium-info', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(r => r.json())
  .then(data => console.log('Premium info response:', data))
  .catch(err => console.log('Erreur premium info:', err));
}

// Vérifier si le composant est chargé
console.log('PremiumManagementPage:', typeof window.PremiumManagementPage);

// Vérifier le routage actuel
console.log('URL actuelle:', window.location.pathname);
console.log('Hash actuel:', window.location.hash);