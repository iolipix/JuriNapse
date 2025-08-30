const fetch = require('node-fetch');

async function createTheophaneAccount() {
    try {
        console.log('📝 Création du compte Théophane avec tes vraies infos...');
        
        const accountData = {
            email: 'theophane.vitrac@gmail.com',
            username: 'theophane',
            password: 'Theophane2005!', // Avec caractère spécial requis
            firstName: 'Théophane',
            lastName: 'Vitrac',
            university: 'Université de Droit',
            graduationYear: 2027,
            isStudent: true,
            bio: 'Étudiant en droit'
        };
        
        const response = await fetch('https://jurinapse-production.up.railway.app/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(accountData)
        });

        const data = await response.json();
        
        console.log('📊 Statut inscription:', response.status);
        console.log('📋 Réponse inscription:', JSON.stringify(data, null, 2));

        if (response.status === 201 || data.success) {
            console.log('✅ Compte créé avec succès !');
            console.log('\n📱 Maintenant teste la connexion avec:');
            console.log('Email: theophane.vitrac@gmail.com');
            console.log('Mot de passe: Theophane2005!');
            
            // Test immédiat de connexion
            console.log('\n🔐 Test de connexion immédiat...');
            
            await new Promise(resolve => setTimeout(resolve, 1000)); // Attendre 1 seconde
            
            const loginResponse = await fetch('https://jurinapse-production.up.railway.app/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    emailOrPseudo: accountData.email,
                    motDePasse: accountData.password
                })
            });

            const loginData = await loginResponse.json();
            
            console.log('📊 Statut login:', loginResponse.status);
            console.log('📋 Réponse login:', JSON.stringify(loginData, null, 2));
            
            if (loginResponse.status === 403) {
                console.log('🎉 PARFAIT ! Ton compte sera redirigé vers la vérification d\'email !');
            }
            
        } else if (response.status === 400 && data.message?.includes('déjà utilisé')) {
            console.log('ℹ️ Le compte existe déjà. Teste directement la connexion avec:');
            console.log('Email: theophane.vitrac@gmail.com');
            console.log('Mot de passe: Theophane2005!');
        } else {
            console.log('❌ Erreur lors de la création:', data.message);
        }

    } catch (error) {
        console.error('❌ Erreur:', error);
    }
}

createTheophaneAccount();
