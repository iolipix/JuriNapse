// Créer le groupe privé manquant avec l'ID spécifique
const mongoose = require('mongoose');
const Group = require('./models/group.model');
const User = require('./models/user.model');

async function createMissingPrivateGroup() {
  try {
    await mongoose.connect('mongodb://localhost:27017/lexilis');
    console.log('Connecté à MongoDB');

    const theo = await User.findOne({ username: 'theophane_mry' });
    if (!theo) {
      console.log('❌ Théophane non trouvé');
      return;
    }

    // Créer un deuxième utilisateur pour la conversation (Thomas)
    let thomas = await User.findOne({ username: 'thomas_test' });
    if (!thomas) {
      thomas = new User({
        username: 'thomas_test',
        firstName: 'Thomas',
        lastName: 'Dupont',
        email: 'thomas@test.com',
        password: 'hashedpassword' // En production, hasher correctement
      });
      await thomas.save();
      console.log('👤 Thomas créé:', thomas._id.toString());
    }

    // Créer le groupe avec l'ID spécifique que vous utilisez
    const targetId = new mongoose.Types.ObjectId('68b3839897500925dc9234a6');
    
    // Vérifier si le groupe existe déjà
    let group = await Group.findById(targetId);
    if (group) {
      console.log('✅ Le groupe existe déjà');
      return;
    }

    // Créer le nouveau groupe
    group = new Group({
      _id: targetId,
      name: 'Chat privé',
      description: 'Conversation privée',
      isPrivate: true,
      adminId: theo._id,
      members: [theo._id, thomas._id],
      moderatorIds: []
    });

    await group.save();
    console.log('✅ Groupe privé créé avec succès!');
    console.log('ID:', group._id.toString());
    console.log('Nom:', group.name);
    console.log('Privé:', group.isPrivate);
    console.log('Membres:', group.members.length);
    
    console.log('🟢 Maintenant vous pouvez tester la suppression d\'historique!');

  } catch (error) {
    if (error.code === 11000) {
      console.log('ℹ️ Le groupe existe déjà avec cet ID');
    } else {
      console.error('Erreur:', error);
    }
  } finally {
    await mongoose.disconnect();
  }
}

createMissingPrivateGroup();
