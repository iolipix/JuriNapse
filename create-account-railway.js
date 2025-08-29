const fetch = require('node-fetch');

async function createAccountOnRailway() {
    try {
        console.log('📝 Création du compte Théophane sur Railway...');
        
        const response = await fetch('https://jurinapse-production.up.railway.app/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'theophane.vitrac@gmail.com',
                username: 'theophane',
                password: 'Theophane2005!',
                firstName: 'Théophane',
                lastName: 'Vitrac',
                university: 'Université de Droit',
                graduationYear: 2027,
                isStudent: true,
                bio: 'Étudiant en droit'
            })
        });

        const data = await response.json();
        
        console.log('📊 Statut HTTP:', response.status);
        console.log('📋 Réponse inscription:', JSON.stringify(data, null, 2));

        if (response.status === 201 || data.success) {
            console.log('✅ Compte créé avec succès sur Railway !');
            
            // Maintenant tester la connexion
            console.log('\n🔐 Test de connexion immédiat...');
            
            const loginResponse = await fetch('https://jurinapse-production.up.railway.app/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    emailOrPseudo: 'theophane.vitrac@gmail.com',
                    motDePasse: 'Theophane2005!'
                })
            });

            const loginData = await loginResponse.json();
            
            console.log('📊 Statut login:', loginResponse.status);
            console.log('📋 Réponse login:', JSON.stringify(loginData, null, 2));

            if (loginResponse.status === 403 && loginData.requiresVerification) {
                console.log('🎉 PARFAIT ! Le système détecte bien le compte non vérifié');
            }
            
        } else {
            console.log('❌ Échec de création du compte');
        }

    } catch (error) {
        console.error('❌ Erreur:', error);
    }
}

createAccountOnRailway();
