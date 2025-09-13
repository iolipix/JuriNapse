const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Configuration MongoDB (ajuste selon ton setup)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jurinapse';

// Schema utilisateur simple (ajuste selon ton modèle)
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  // autres champs...
});

const User = mongoose.model('User', userSchema);

async function resetUserPassword(usernameOrEmail, newPassword) {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Chercher l'utilisateur par username ou email
    const user = await User.findOne({
      $or: [
        { username: usernameOrEmail },
        { email: usernameOrEmail }
      ]
    });

    if (!user) {
      console.log('❌ Utilisateur introuvable:', usernameOrEmail);
      return;
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Mettre à jour le mot de passe
    user.password = hashedPassword;
    await user.save();

    console.log('✅ Mot de passe mis à jour pour:', user.username);
    console.log('📧 Email:', user.email);
    console.log('🔑 Nouveau mot de passe:', newPassword);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Usage depuis la ligne de commande
const [,, usernameOrEmail, newPassword] = process.argv;

if (!usernameOrEmail || !newPassword) {
  console.log('Usage: node reset-user-password.js <username|email> <nouveau_mot_de_passe>');
  console.log('Exemple: node reset-user-password.js manonn Password123!');
  process.exit(1);
}

resetUserPassword(usernameOrEmail, newPassword);
