// Exemple de gestion de la connexion avec vérification email
// À intégrer dans votre frontend

async function handleLogin(emailOrUsername, password) {
    try {
        const response = await fetch('https://jurinapse-production.up.railway.app/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                emailOrPseudo: emailOrUsername,
                password: password
            }),
            credentials: 'include' // Important pour les cookies
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Connexion réussie
            console.log('✅ Connexion réussie');
            // Rediriger vers la page principale
            window.location.href = '/dashboard';
            
        } else if (response.status === 403 && data.requiresVerification) {
            // Email non vérifié
            console.log('📧 Vérification email requise');
            
            // Stocker l'email pour la page de vérification
            localStorage.setItem('pendingVerificationEmail', data.email);
            
            // Rediriger vers la page de vérification
            window.location.href = `/verification-required.html?email=${encodeURIComponent(data.email)}`;
            
        } else {
            // Autres erreurs (mot de passe incorrect, etc.)
            console.error('❌ Erreur de connexion:', data.message);
            // Afficher le message d'erreur dans votre UI
            showError(data.message);
        }
        
    } catch (error) {
        console.error('❌ Erreur réseau:', error);
        showError('Erreur de connexion au serveur');
    }
}

// Exemple d'utilisation avec un formulaire
function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const emailOrUsername = document.getElementById('emailOrUsername').value;
        const password = document.getElementById('password').value;
        
        await handleLogin(emailOrUsername, password);
    });
}

// Fonction pour afficher les erreurs (à adapter selon votre UI)
function showError(message) {
    // Adapter selon votre framework (React, Vue, etc.)
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    } else {
        alert(message); // Fallback
    }
}

// Initialiser le formulaire quand la page est chargée
document.addEventListener('DOMContentLoaded', setupLoginForm);
