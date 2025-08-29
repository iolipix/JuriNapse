// 🎯 CRÉER UTILISATEUR SYSTÈME SEULEMENT
const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });
const User = require('./backend/models/user.model');

async function createDeletedUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
    });
    
    const deletedUser = new User({
      username: 'utilisateur_supprime',
      email: 'deleted@jurinapse.fr', 
      password: 'deleted_account',
      firstName: 'Utilisateur',
      lastName: 'Supprimé',
      isDeleted: true,
      university: 'Compte supprimé',
      isStudent: false
    });
    
    await deletedUser.save();
    console.log('✅ Utilisateur système créé:', deletedUser._id);
    
    // Ce sera votre ID à utiliser pour remplacer manuellement les orphelins
    console.log('🆔 ID à retenir:', deletedUser._id.toString());
    
  } catch (error) {
    if (error.code === 11000) {
      console.log('✅ Utilisateur système déjà existant');
    } else {
      console.error('❌ Erreur:', error.message);
    }
  } finally {
    await mongoose.disconnect();
  }
}

createDeletedUser();
