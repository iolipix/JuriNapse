const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/user.model');
const VerificationToken = require('./models/verificationToken.model');
const crypto = require('crypto');

async function recreateTheophaneAccount() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jurinapse');
        console.log('✅ Connecté à MongoDB');

        // Vérifier si le compte existe déjà
        const existingUser = await User.findOne({ email: 'theophane.vitrac@gmail.com' });
        if (existingUser) {
            console.log('⚠️ Le compte existe déjà');
            return;
        }

        // Créer le hash du mot de passe
        const hashedPassword = await bcrypt.hash('Theophane2005', 12);

        // Créer l'utilisateur
        const newUser = new User({
            email: 'theophane.vitrac@gmail.com',
            username: 'theophane',
            password: hashedPassword,
            firstName: 'Théophane',
            lastName: 'Vitrac',
            university: 'Université de Droit',
            graduationYear: 2027,
            isStudent: true,
            bio: 'Étudiant en droit',
            isVerified: false,
            requiresVerification: true
        });

        const savedUser = await newUser.save();
        console.log('✅ Compte Théophane recréé:', savedUser._id);

        // Créer un token de vérification
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = new Date();
        tokenExpiry.setHours(tokenExpiry.getHours() + 24); // Expire dans 24h

        const newToken = new VerificationToken({
            userId: savedUser._id,
            token: verificationToken,
            expiresAt: tokenExpiry
        });

        await newToken.save();
        console.log('✅ Token de vérification créé');
        console.log('🎫 Token:', verificationToken);

        console.log('\n📋 Résumé du compte:');
        console.log('- Email: theophane.vitrac@gmail.com');
        console.log('- Username: theophane');  
        console.log('- Mot de passe: Theophane2005');
        console.log('- Vérifié: NON (nécessite vérification)');
        console.log('- ID utilisateur:', savedUser._id);

        console.log('\n🔗 Pour vérifier le compte manuellement:');
        console.log(`https://jurinapse-production.up.railway.app/verify-email?token=${verificationToken}`);

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        mongoose.disconnect();
    }
}

recreateTheophaneAccount();
