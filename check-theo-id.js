// Vérifier l'ID exact de Théophane
const mongoose = require('mongoose');
const User = require('./models/user.model');

async function checkTheoId() {
  try {
    await mongoose.connect('mongodb://localhost:27017/lexilis');
    console.log('Connecté à MongoDB');

    const theo = await User.findOne({ username: 'theophane_mry' });
    if (theo) {
      console.log('=== THÉOPHANE TROUVÉ ===');
      console.log('ID exact:', theo._id.toString());
      console.log('Username:', theo.username);
      console.log('Email:', theo.email);
      console.log('Nom:', `${theo.firstName} ${theo.lastName}`);
    } else {
      console.log('❌ Théophane non trouvé');
      
      // Lister tous les utilisateurs
      const allUsers = await User.find({});
      console.log('Tous les utilisateurs:');
      allUsers.forEach(u => {
        console.log(`- ID: ${u._id.toString()}, Username: ${u.username}`);
      });
    }

  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkTheoId();
