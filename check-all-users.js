const mongoose = require('mongoose');
const User = require('./models/user.model');

async function checkAllUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jurinapse');
        console.log('✅ Connecté à MongoDB');

        // Compter tous les utilisateurs
        const userCount = await User.countDocuments();
        console.log(`\n📊 Total utilisateurs: ${userCount}`);

        if (userCount > 0) {
            // Lister tous les utilisateurs
            const users = await User.find({}, { 
                email: 1, 
                username: 1, 
                isVerified: 1, 
                firstName: 1, 
                lastName: 1,
                createdAt: 1
            }).sort({ createdAt: -1 }).limit(10);

            console.log('\n👥 Derniers utilisateurs:');
            users.forEach((user, index) => {
                console.log(`${index + 1}. ${user.email} (@${user.username})`);
                console.log(`   - Nom: ${user.firstName} ${user.lastName}`);
                console.log(`   - Vérifié: ${user.isVerified ? '✅' : '❌'}`);
                console.log(`   - Créé: ${user.createdAt}`);
                console.log('');
            });
        }

        // Chercher spécifiquement ton email dans différentes variations
        const emailVariations = [
            'theophane.vitrac@gmail.com',
            'theophane.vitrac@gmail.fr',
            'theophane@gmail.com'
        ];

        for (const email of emailVariations) {
            const user = await User.findOne({ email: email });
            if (user) {
                console.log(`✅ Trouvé avec ${email}:`, {
                    id: user._id,
                    username: user.username,
                    isVerified: user.isVerified
                });
            }
        }

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        mongoose.disconnect();
    }
}

checkAllUsers();
