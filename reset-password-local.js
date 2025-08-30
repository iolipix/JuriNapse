const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/user.model');

async function resetTheophanePassword() {
    try {
        // Connexion à la base locale pour test (pas Railway)
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jurinapse');
        console.log('✅ Connecté à la base de données');

        const email = 'theophane.vitrac@gmail.com';
        const newPassword = 'Theophane2005!';

        console.log('🔍 Recherche du compte:', email);
        const user = await User.findOne({ email });

        if (!user) {
            console.log('❌ Compte non trouvé dans cette base');
            console.log('💡 Le compte existe sur Railway mais pas ici');
            console.log('📱 Solution: Utilise la fonction "Mot de passe oublié" sur le site');
            return;
        }

        console.log('👤 Compte trouvé:', user.username);
        console.log('🔒 Génération du nouveau hash...');
        
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        
        await User.findByIdAndUpdate(user._id, {
            password: hashedPassword
        });

        console.log('✅ Mot de passe mis à jour !');
        console.log('📋 Nouvelles infos:');
        console.log('- Email:', email);
        console.log('- Mot de passe:', newPassword);

        // Test du nouveau mot de passe
        const testUser = await User.findOne({ email });
        const isValid = await bcrypt.compare(newPassword, testUser.password);
        console.log('🔑 Test du nouveau mot de passe:', isValid ? '✅' : '❌');

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        mongoose.disconnect();
    }
}

console.log('⚠️  ATTENTION: Ce script modifie la base LOCAL, pas Railway');
console.log('📱 Pour Railway, utilise la fonction "Mot de passe oublié" sur le site\n');

resetTheophanePassword();
