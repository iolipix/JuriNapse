const fetch = require('node-fetch');

async function findYourAccount() {
    console.log('🔍 Recherche de votre compte...\n');
    
    try {
        // Tester différents emails possibles
        const emails = [
            'theophane.vitrac@gmail.com',
            'theophane@gmail.com',
            'vitrac.theophane@gmail.com',
            'theophane.vitrac@outlook.com',
            'theophane@example.com'
        ];
        
        for (const email of emails) {
            console.log(`Test de l'email: ${email}`);
            
            const response = await fetch('https://jurinapse-production.up.railway.app/api/auth/resend-verification-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email
                })
            });
            
            const result = await response.json();
            
            if (response.status === 200 || !result.message?.includes('Aucun utilisateur trouvé')) {
                console.log(`✅ Email trouvé: ${email}`);
                console.log('Réponse:', result);
                return;
            } else {
                console.log(`❌ Pas trouvé: ${email}`);
            }
        }
        
        // Si aucun email trouvé, essayer de créer un compte
        console.log('\n🆕 Aucun compte trouvé. Créons-en un...');
        
        const registerResponse = await fetch('https://jurinapse-production.up.railway.app/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'theophane.vitrac@gmail.com',
                username: 'theophane',
                password: 'MonMotDePasse123!',
                firstName: 'Théophane',
                lastName: 'Vitrac',
                university: 'Université de Droit',
                graduationYear: 2025,
                isStudent: true,
                bio: 'Étudiant en droit'
            })
        });
        
        console.log('Status d\'inscription:', registerResponse.status);
        const registerResult = await registerResponse.json();
        console.log('Résultat inscription:', registerResult);
        
        if (registerResponse.status === 200 || registerResponse.status === 201) {
            console.log('\n✅ Compte créé avec succès!');
            
            // Maintenant essayer de renvoyer l'email
            console.log('\n📧 Tentative de renvoi d\'email...');
            
            const resendResponse = await fetch('https://jurinapse-production.up.railway.app/api/auth/resend-verification-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: 'theophane.vitrac@gmail.com'
                })
            });
            
            const resendResult = await resendResponse.json();
            console.log('Status renvoi:', resendResponse.status);
            console.log('Résultat renvoi:', resendResult);
            
        } else {
            console.log('❌ Erreur lors de la création du compte');
            if (registerResult.message?.includes('déjà utilisé')) {
                console.log('🤔 L\'email ou le username est déjà utilisé. Essayons de nous connecter...');
                
                // Essayer de se connecter
                const loginResponse = await fetch('https://jurinapse-production.up.railway.app/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        emailOrUsername: 'theophane.vitrac@gmail.com',
                        password: 'MonMotDePasse123!'
                    })
                });
                
                const loginResult = await loginResponse.json();
                console.log('Status connexion:', loginResponse.status);
                console.log('Résultat connexion:', loginResult);
            }
        }
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }
}

findYourAccount();
