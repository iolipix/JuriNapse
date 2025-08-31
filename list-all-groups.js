// Script pour lister tous les groupes/conversations
const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: String,
  isPrivate: Boolean,
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  username: String,
  firstName: String,
  lastName: String,
  email: String
});

const Group = mongoose.model('Group', groupSchema);
const User = mongoose.model('User', userSchema);

async function listAllGroups() {
  try {
    await mongoose.connect('mongodb://localhost:27017/lexilis');
    console.log('Connecté à MongoDB');

    const groups = await Group.find({}).populate('members', 'username firstName lastName');
    
    console.log(`=== TOUS LES GROUPES/CONVERSATIONS (${groups.length}) ===`);
    groups.forEach((group, index) => {
      console.log(`${index + 1}. ID: ${group._id.toString()}`);
      console.log(`   Nom: ${group.name}`);
      console.log(`   Est privé: ${group.isPrivate}`);
      console.log(`   Membres: ${group.members.map(m => m.username || `${m.firstName} ${m.lastName}`).join(', ')}`);
      console.log('---');
    });

    if (groups.length === 0) {
      console.log('❌ Aucun groupe trouvé');
    }

  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await mongoose.disconnect();
  }
}

listAllGroups();
