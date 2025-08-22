require('dotenv').config({ path: './backend/config/.env' });
const mongoose = require('mongoose');
const User = require('./backend/models/user.model');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
    try {
        console.log('🔌 Connexion rapide à MongoDB...');
        
        // Connexion simple et directe
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connecté à MongoDB');
        
        // Chercher si theophane_mry existe déjà et le rendre admin
        const user = await User.findOne({ username: 'theophane_mry' });
        
        if (user) {
            console.log('👤 Utilisateur trouvé, mise à jour vers admin...');
            await User.updateOne(
                { _id: user._id },
                { role: 'admin' }
            );
            console.log(`✅ ${user.username} est maintenant admin !`);
            console.log(`🆔 ID: ${user._id}`);
        } else {
            console.log('❌ Utilisateur theophane_mry non trouvé');
        }
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Déconnecté de MongoDB');
    }
}

createAdminUser();
