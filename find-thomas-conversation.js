// Script pour trouver la conversation avec Thomas
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

async function findThomasConversation() {
  try {
    await mongoose.connect('mongodb://localhost:27017/lexilis');
    console.log('Connecté à MongoDB');

    // Chercher l'utilisateur Thomas
    const thomas = await User.findOne({
      $or: [
        { username: { $regex: /thomas/i } },
        { firstName: { $regex: /thomas/i } },
        { lastName: { $regex: /thomas/i } }
      ]
    });

    if (!thomas) {
      console.log('❌ Utilisateur Thomas non trouvé');
      return;
    }

    console.log('👤 Thomas trouvé:', {
      id: thomas._id.toString(),
      username: thomas.username,
      name: `${thomas.firstName} ${thomas.lastName}`
    });

    // Chercher votre utilisateur (Théophane)
    const theo = await User.findOne({
      $or: [
        { username: { $regex: /theo/i } },
        { firstName: { $regex: /theo/i } },
        { email: { $regex: /theo/i } }
      ]
    });

    if (!theo) {
      console.log('❌ Utilisateur Théophane non trouvé');
      return;
    }

    console.log('👤 Théophane trouvé:', {
      id: theo._id.toString(),
      username: theo.username,
      name: `${theo.firstName} ${theo.lastName}`
    });

    // Chercher les conversations contenant les deux utilisateurs
    const conversations = await Group.find({
      members: { $all: [thomas._id, theo._id] }
    }).populate('members', 'username firstName lastName');

    console.log(`\n=== CONVERSATIONS TROUVÉES (${conversations.length}) ===`);
    
    for (let conv of conversations) {
      console.log('---');
      console.log('ID:', conv._id.toString());
      console.log('Nom:', conv.name);
      console.log('Est privé:', conv.isPrivate);
      console.log('Membres:', conv.members.map(m => m.username || `${m.firstName} ${m.lastName}`));
      
      if (conv.isPrivate) {
        console.log('🟢 Conversation privée - suppression d\'historique AUTORISÉE');
      } else {
        console.log('🔴 Conversation publique - suppression d\'historique REFUSÉE');
      }
    }

  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await mongoose.disconnect();
  }
}

findThomasConversation();
