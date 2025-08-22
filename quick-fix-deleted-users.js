// 🔧 RÉPARATION RAPIDE - STRICT MINIMUM
const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

const Message = require('./backend/models/message.model');
const User = require('./backend/models/user.model');

async function quickFix() {
  try {
    console.log('🔗 Connexion...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000, // 30 secondes
      socketTimeoutMS: 45000, // 45 secondes
    });
    console.log('✅ Connecté');

    // Créer utilisateur système s'il n'existe pas
    const deletedUser = await User.findOneAndUpdate(
      { username: 'utilisateur_supprime' },
      {
        username: 'utilisateur_supprime',
        email: 'deleted@jurinapse.fr',
        password: 'deleted_account',
        firstName: 'Utilisateur',
        lastName: 'Supprimé',
        isDeleted: true
      },
      { upsert: true, new: true }
    );
    
    console.log('✅ Utilisateur système:', deletedUser._id);

    // Réparation directe par requête bulk
    console.log('🔧 Réparation messages...');
    const result = await Message.updateMany(
      {
        $or: [
          { authorId: { $exists: false } },
          { authorId: null },
          { authorId: "64b8f234a1b2c3d4e5f6g789" }, // ID exemple d'utilisateur supprimé
          { authorId: "66b8f234a1b2c3d4e5f6g789" }  // ID exemple d'utilisateur supprimé
        ]
      },
      { $set: { authorId: deletedUser._id } }
    );

    console.log(`✅ ${result.modifiedCount} messages réparés`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté');
  }
}

quickFix();
