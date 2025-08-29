const mongoose = require('mongoose');
const User = require('./models/user.model');

// Charger les variables d'environnement
require('dotenv').config();

async function connectDatabase() {
    try {
        console.log('🔄 Connexion à MongoDB...');
        await mongoose.connect(`mongodb://127.0.0.1:27017/jurinapse`);
        console.log('✅ MongoDB connecté\n');
    } catch (error) {
        console.error('❌ Erreur de connexion MongoDB:', error.message);
        throw error;
    }
}

async function checkUserVerificationStatus() {
    console.log('🔍 Vérification du statut des utilisateurs...\n');
    
    try {
        // Connecter la base de données
        await connectDatabase();
        
        // Trouver tous les utilisateurs
        const users = await User.find({}, 'email username isVerified createdAt');
        
        console.log(`👥 ${users.length} utilisateur(s) trouvé(s):\n`);
        
        users.forEach((user, index) => {
            console.log(`${index + 1}. Email: ${user.email}`);
            console.log(`   Username: ${user.username}`);
            console.log(`   Vérifié: ${user.isVerified ? '✅ OUI' : '❌ NON'}`);
            console.log(`   Créé le: ${user.createdAt.toLocaleString()}`);
            console.log('');
        });
        
        // Compter les utilisateurs non vérifiés
        const unverified = users.filter(u => !u.isVerified);
        console.log(`📊 Résumé:`);
        console.log(`   - Vérifiés: ${users.length - unverified.length}`);
        console.log(`   - Non vérifiés: ${unverified.length}`);
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        // Fermer la connexion MongoDB
        await mongoose.connection.close();
        console.log('\n📴 Connexion MongoDB fermée');
    }
}

// Lancer la vérification
checkUserVerificationStatus();
