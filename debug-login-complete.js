const fetch = require('node-fetch');

async function debugLoginIssue() {
    try {
        console.log('🔍 Diagnostic complet du problème de connexion\n');

        // Test 1: Vérifier si ton email existe
        console.log('=== TEST 1: Tentative avec ton email ===');
        const testData1 = {
            emailOrPseudo: 'theophane.vitrac@gmail.com',
            motDePasse: 'Theophane2005'  // Sans !
        };

        const response1 = await fetch('https://jurinapse-production.up.railway.app/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData1)
        });
        
        const data1 = await response1.json();
        console.log('Statut:', response1.status);
        console.log('Réponse:', JSON.stringify(data1, null, 2));

        // Test 2: Avec caractère spécial
        console.log('\n=== TEST 2: Avec caractère spécial ===');
        const testData2 = {
            emailOrPseudo: 'theophane.vitrac@gmail.com',
            motDePasse: 'Theophane2005!'  // Avec !
        };

        const response2 = await fetch('https://jurinapse-production.up.railway.app/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData2)
        });
        
        const data2 = await response2.json();
        console.log('Statut:', response2.status);
        console.log('Réponse:', JSON.stringify(data2, null, 2));

        // Test 3: Avec username
        console.log('\n=== TEST 3: Avec username ===');
        const testData3 = {
            emailOrPseudo: 'theophane',
            motDePasse: 'Theophane2005!'
        };

        const response3 = await fetch('https://jurinapse-production.up.railway.app/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData3)
        });
        
        const data3 = await response3.json();
        console.log('Statut:', response3.status);
        console.log('Réponse:', JSON.stringify(data3, null, 2));

        // Test 4: Créer le compte s'il n'existe pas
        console.log('\n=== TEST 4: Création de compte ===');
        const registerData = {
            email: 'theophane.vitrac@gmail.com',
            username: 'theophane',
            password: 'Theophane2005!',
            firstName: 'Théophane',
            lastName: 'Vitrac',
            university: 'Université de Droit',
            graduationYear: 2027,
            isStudent: true,
            bio: 'Étudiant en droit'
        };

        const registerResponse = await fetch('https://jurinapse-production.up.railway.app/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registerData)
        });
        
        const registerResult = await registerResponse.json();
        console.log('Statut inscription:', registerResponse.status);
        console.log('Réponse inscription:', JSON.stringify(registerResult, null, 2));

        if (registerResponse.status === 201 || registerResult.success) {
            console.log('\n✅ Compte créé ! Maintenant test de connexion...');
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const finalLoginResponse = await fetch('https://jurinapse-production.up.railway.app/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    emailOrPseudo: 'theophane.vitrac@gmail.com',
                    motDePasse: 'Theophane2005!'
                })
            });

            const finalLoginData = await finalLoginResponse.json();
            console.log('\n=== RÉSULTAT FINAL ===');
            console.log('Statut:', finalLoginResponse.status);
            console.log('Réponse:', JSON.stringify(finalLoginData, null, 2));

            if (finalLoginResponse.status === 403 && finalLoginData.requiresVerification) {
                console.log('\n🎉 SUCCÈS ! Tu devrais maintenant être redirigé vers VerificationRequiredPage !');
            } else if (finalLoginResponse.status === 400) {
                console.log('\n❌ Encore un problème de mot de passe/email');
            }
        }

    } catch (error) {
        console.error('❌ Erreur:', error);
    }
}

debugLoginIssue();
