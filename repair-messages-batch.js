// 🔧 RÉPARATION PAR BATCH - ÉVITER LES TIMEOUTS
const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

const Message = require('./backend/models/message.model');
const User = require('./backend/models/user.model');

async function repairInBatches() {
  try {
    console.log('🔗 Connexion MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 5
    });
    console.log('✅ Connecté');

    // 1. Créer l'utilisateur système rapidement
    console.log('\n👤 Étape 1: Utilisateur système...');
    let deletedUser;
    try {
      deletedUser = await User.findOne({ username: 'utilisateur_supprime' });
      if (!deletedUser) {
        deletedUser = new User({
          username: 'utilisateur_supprime',
          email: 'deleted@jurinapse.fr',
          password: '$2a$12$dummy.hash.for.deleted.user.security.purposes',
          firstName: 'Utilisateur',
          lastName: 'Supprimé',
          isDeleted: true,
          university: 'Compte supprimé',
          isStudent: false
        });
        await deletedUser.save();
        console.log('✅ Utilisateur système créé:', deletedUser._id);
      } else {
        console.log('✅ Utilisateur système existant:', deletedUser._id);
      }
    } catch (userError) {
      console.log('❌ Erreur création utilisateur:', userError.message);
      return;
    }

    const deletedUserId = deletedUser._id;

    // 2. Réparer les messages NULL ou undefined en batch
    console.log('\n🔧 Étape 2: Réparation messages NULL...');
    const nullResult = await Message.updateMany(
      {
        $or: [
          { authorId: null },
          { authorId: { $exists: false } }
        ]
      },
      { $set: { authorId: deletedUserId } }
    );
    console.log(`✅ Messages NULL réparés: ${nullResult.modifiedCount}`);

    // 3. Trouver et réparer les IDs invalides par petits batch
    console.log('\n🔍 Étape 3: Recherche IDs invalides...');
    
    // Récupérer tous les IDs d'utilisateurs valides
    const validUserIds = await User.find({}, '_id').lean();
    const validIdSet = new Set(validUserIds.map(u => u._id.toString()));
    console.log(`📊 Utilisateurs valides: ${validIdSet.size}`);

    // Traiter par batch de 100 messages
    let processed = 0;
    let repaired = 0;
    const batchSize = 100;
    
    while (true) {
      const messages = await Message.find({}, 'authorId')
        .skip(processed)
        .limit(batchSize)
        .lean();
      
      if (messages.length === 0) break;

      const orphanIds = [];
      for (const message of messages) {
        if (message.authorId && !validIdSet.has(message.authorId.toString())) {
          orphanIds.push(message._id);
        }
      }

      if (orphanIds.length > 0) {
        const batchResult = await Message.updateMany(
          { _id: { $in: orphanIds } },
          { $set: { authorId: deletedUserId } }
        );
        repaired += batchResult.modifiedCount;
        console.log(`   Batch ${Math.floor(processed/batchSize) + 1}: ${batchResult.modifiedCount} réparés`);
      }

      processed += messages.length;
      
      if (processed % 500 === 0) {
        console.log(`   Progression: ${processed} messages vérifiés...`);
      }
    }

    console.log(`\n🎉 RÉPARATION TERMINÉE !`);
    console.log(`   Messages vérifiés: ${processed}`);
    console.log(`   Messages réparés: ${repaired}`);
    console.log(`   Utilisateur système: ${deletedUserId}`);

    // Test final
    console.log('\n🧪 Test final...');
    const testMessage = await Message.findOne({ authorId: deletedUserId })
      .populate({ path: 'authorId', options: { strictPopulate: false } });
    
    if (testMessage) {
      console.log('✅ Test réussi - API devrait fonctionner maintenant');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté');
  }
}

console.log('🚀 RÉPARATION PAR BATCH - ÉVITER TIMEOUTS');
console.log('=========================================');
repairInBatches();
