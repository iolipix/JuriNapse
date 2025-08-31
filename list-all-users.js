// Script pour lister tous les utilisateurs
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  firstName: String,
  lastName: String,
  email: String
});

const User = mongoose.model('User', userSchema);

async function listAllUsers() {
  try {
    await mongoose.connect('mongodb://localhost:27017/lexilis');
    console.log('Connecté à MongoDB');

    const users = await User.find({}, 'username firstName lastName email');
    
    console.log(`=== TOUS LES UTILISATEURS (${users.length}) ===`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user._id.toString()}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Nom: ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.email}`);
      console.log('---');
    });

  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await mongoose.disconnect();
  }
}

listAllUsers();
