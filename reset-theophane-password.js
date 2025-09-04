require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./backend/models/user.model');

async function resetTheophanePassword() {
  try {
    console.log('🔄 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    const theophaneId = '68b25c61a29835348429424a';
    
    console.log('🔍 Recherche du compte theophane...');
    
    // Chercher theophane par ID et par username
    const [userById, userByUsername] = await Promise.all([
      User.findById(theophaneId),
      User.findOne({ username: 'theophane_mry' })
    ]);
    
    console.log('📊 Résultats recherche:');
    console.log('- Par ID:', userById ? `Trouvé: ${userById.username}` : 'Non trouvé');
    console.log('- Par username:', userByUsername ? `Trouvé: ${userByUsername._id}` : 'Non trouvé');
    
    const user = userById || userByUsername;
    
    if (!user) {
      console.log('❌ Aucun compte theophane trouvé !');
      return;
    }
    
    console.log('📋 Informations actuelles du compte:');
    console.log('- ID:', user._id.toString());
    console.log('- Username:', user.username);
    console.log('- Email:', user.email);
    console.log('- Role:', user.role);
    console.log('- isDeleted:', user.isDeleted);
    console.log('- canLogin:', user.canLogin);
    console.log('- Following:', user.following?.length || 0);
    console.log('- Followers:', user.followers?.length || 0);
    console.log('- Following Count:', user.followingCount || 0);
    console.log('- Followers Count:', user.followersCount || 0);
    
    // Reset le mot de passe
    const newPassword = 'password123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      isDeleted: false,
      canLogin: true
    });
    
    console.log('✅ Mot de passe reseté à:', newPassword);
    console.log('✅ Compte réactivé (isDeleted: false, canLogin: true)');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

resetTheophanePassword();
