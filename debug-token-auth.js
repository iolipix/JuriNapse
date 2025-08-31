// Script de diagnostic pour l'authentification token
console.log('=== DIAGNOSTIC TOKEN AUTH ===');

// Simuler ce que fait le frontend
const token = localStorage.getItem('token');
console.log('Token présent:', !!token);

if (token) {
    try {
        // Décoder le payload JWT (partie centrale après le premier point)
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Token payload:', payload);
        
        // Vérifier l'expiration
        const now = Date.now() / 1000;
        const isExpired = payload.exp < now;
        console.log('Token expiré:', isExpired);
        console.log('Expiration:', new Date(payload.exp * 1000));
        console.log('Maintenant:', new Date());
        
        if (isExpired) {
            console.log('🔴 LE TOKEN A EXPIRE - Reconnexion nécessaire');
        } else {
            console.log('🟢 Token valide');
        }
    } catch (error) {
        console.log('❌ Erreur lors du décodage du token:', error);
    }
} else {
    console.log('🔴 AUCUN TOKEN - Connexion nécessaire');
}

// Test de l'endpoint
console.log('\n=== TEST ENDPOINT ===');
fetch('http://localhost:5000/api/groups/68b3839897500925dc9234a6/delete-history', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
})
.then(response => {
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    if (response.status === 401) {
        console.log('🔴 Erreur 401: Token invalide ou expiré');
    }
    return response.text();
})
.then(text => {
    console.log('Response:', text);
})
.catch(error => {
    console.log('Erreur:', error);
});
