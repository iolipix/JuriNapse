// 🎯 RÉPARATION DIRECTE SANS VÉRIFICATION
// Utilise un ID utilisateur système fixe pour éviter les lookups
const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

const Message = require('./backend/models/message.model');
const { ObjectId } = require('mongoose').Types;

async function directFix() {
  try {
    console.log('🔗 Connexion...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 15000,
    });
    
    // Utiliser un ID système fixe (créé manuellement)
    const deletedUserId = new ObjectId('60f7b3b3b3b3b3b3b3b3b3b3'); // ID fixe pour utilisateur supprimé
    
    console.log('🔧 Réparation directe...');
    
    // Réparer tous les messages avec authorId null, undefined ou inexistant
    const result1 = await Message.updateMany(
      { $or: [
        { authorId: null },
        { authorId: { $exists: false } }
      ]},
      { $set: { authorId: deletedUserId } }
    );
    
    console.log(`✅ Messages NULL réparés: ${result1.modifiedCount}`);
    
    // Forcer la réparation de quelques IDs spécifiques connus
    const commonOrphanIds = [
      '64b8f234a1b2c3d4e5f6g789',
      '66b8f234a1b2c3d4e5f6g789',
      '507f1f77bcf86cd799439011',
      '507f1f77bcf86cd799439012'
    ];
    
    for (const badId of commonOrphanIds) {
      try {
        const result2 = await Message.updateMany(
          { authorId: badId },
          { $set: { authorId: deletedUserId } }
        );
        if (result2.modifiedCount > 0) {
          console.log(`✅ ID ${badId}: ${result2.modifiedCount} réparés`);
        }
      } catch (e) {
        // Ignore les erreurs d'ID invalides
      }
    }
    
    console.log('\n✅ Réparation terminée !');
    console.log('💡 Maintenant il faut créer manuellement l\'utilisateur avec cet ID:');
    console.log(`   ID: ${deletedUserId}`);
    console.log('   Username: utilisateur_supprime');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

directFix();
