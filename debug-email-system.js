const mongoose = require('mongoose');
const User = require('./models/user.model');
const VerificationToken = require('./models/verificationToken.model');

async function debugEmailSystem() {
    try {
        await mongoose.connect('mongodb+srv://theophane:Theophane2005@jurinapse.t9z3v.mongodb.net/jurinapse?retryWrites=true&w=majority&appName=JuriNapse');
        console.log('✅ Connecté à MongoDB');

        // 1. Vérifier votre utilisateur
        const user = await User.findOne({ email: 'theophane.vitrac@gmail.com' });
        if (user) {
            console.log('\n📧 Votre utilisateur:');
            console.log('- ID:', user._id);
            console.log('- Email:', user.email);
            console.log('- Username:', user.username);
            console.log('- isVerified:', user.isVerified);
            console.log('- requiresVerification:', user.requiresVerification);
            
            // 2. Vérifier les tokens de vérification existants
            const verifications = await VerificationToken.find({ userId: user._id }).sort({ createdAt: -1 });
            console.log('\n🔑 Tokens de vérification pour votre compte:');
            if (verifications.length === 0) {
                console.log('❌ Aucun token trouvé');
            } else {
                verifications.forEach((v, i) => {
                    console.log(`${i + 1}. Token: ${v.token.substring(0, 20)}...`);
                    console.log(`   Créé: ${v.createdAt}`);
                    console.log(`   Expire: ${v.expiresAt}`);
                    console.log(`   Expiré: ${v.expiresAt < new Date() ? 'OUI' : 'NON'}`);
                });
            }
        } else {
            console.log('❌ Utilisateur non trouvé avec cet email');
            
            // Chercher par username si pas trouvé par email
            const userByUsername = await User.findOne({ username: 'theophane' });
            if (userByUsername) {
                console.log('\n👤 Trouvé par username:');
                console.log('- Email:', userByUsername.email);
                console.log('- isVerified:', userByUsername.isVerified);
            }
        }

        // 3. Tester la création d'un nouveau token
        console.log('\n🧪 Test de création de token...');
        if (user) {
            // Supprimer les anciens tokens
            await VerificationToken.deleteMany({ userId: user._id });
            
            // Créer un nouveau token
            const crypto = require('crypto');
            const newToken = crypto.randomBytes(32).toString('hex');
            
            const emailVerification = new VerificationToken({
                userId: user._id,
                token: newToken,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
            });
            
            await emailVerification.save();
            console.log('✅ Nouveau token créé:', newToken.substring(0, 20) + '...');
            
            // URL de vérification complète
            const verificationUrl = `https://jurinapse.com/verify-email?token=${newToken}`;
            console.log('\n🔗 Lien de vérification:');
            console.log(verificationUrl);
            
            // Test API direct
            console.log('\n🌐 Test API Railway:');
            const fetch = require('node-fetch');
            try {
                const apiResponse = await fetch('https://jurinapse-production.up.railway.app/api/auth/resend-verification-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: user.email
                    })
                });
                
                const result = await apiResponse.json();
                console.log('Response status:', apiResponse.status);
                console.log('Response body:', result);
            } catch (apiError) {
                console.log('❌ Erreur API:', apiError.message);
            }
        }

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        mongoose.disconnect();
    }
}

debugEmailSystem();
