// Script pour vérifier le type de conversation avec Thomas
const mongoose = require('mongoose');

// Schema du groupe pour la vérification
const groupSchema = new mongoose.Schema({
  name: String,
  isPrivate: Boolean,
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // autres champs...
});

const Group = mongoose.model('Group', groupSchema);

async function checkGroupType() {
  try {
    // Connexion à MongoDB (utiliser la même config que votre app)
    await mongoose.connect('mongodb://localhost:27017/lexilis');
    console.log('Connecté à MongoDB');

    const groupId = '68b3839897500925dc9234a6';
    const group = await Group.findById(groupId)
      .populate('members', 'username firstName lastName');

    if (!group) {
      console.log('❌ Groupe non trouvé');
      return;
    }

    console.log('=== INFORMATION DU GROUPE ===');
    console.log('ID:', group._id.toString());
    console.log('Nom:', group.name);
    console.log('Est privé:', group.isPrivate);
    console.log('Nombre de membres:', group.members.length);
    console.log('Membres:', group.members.map(m => m.username || `${m.firstName} ${m.lastName}`));

    if (!group.isPrivate) {
      console.log('🔴 PROBLÈME: Ce groupe n\'est PAS privé');
      console.log('   → La suppression d\'historique n\'est autorisée que pour les conversations privées');
      console.log('   → Solution: Convertir en conversation privée ou modifier la logique backend');
    } else {
      console.log('🟢 Ce groupe est privé - suppression d\'historique autorisée');
    }

  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkGroupType();
