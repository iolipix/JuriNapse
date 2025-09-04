const mongoose = require('mongoose');
require('dotenv').config();

const main = async () => {
  try {
    // Connexion MongoDB
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Schema simple
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

    // Mise à jour directe
    console.log('🔧 Mise à jour de theophane_mry...');
    
    const result = await User.updateOne(
      { username: 'theophane_mry' },
      {
        role: 'administrator',
        roles: ['user', 'administrator', 'moderator', 'premium']
      }
    );

    console.log('📝 Résultat:', result);

    // Vérification
    const user = await User.findOne({ username: 'theophane_mry' });
    console.log('✅ Vérification:');
    console.log('- Username:', user.username);
    console.log('- Role:', user.role);
    console.log('- Roles:', user.roles);

    console.log('🎉 Terminé !');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.connection.close();
  }
};

main();
