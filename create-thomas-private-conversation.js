// Script pour créer Thomas et une conversation privée
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  firstName: String,
  lastName: String,
  email: String,
  password: String,
  profilePicture: String
}, { timestamps: true });

const groupSchema = new mongoose.Schema({
  name: String,
  isPrivate: Boolean,
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Group = mongoose.model('Group', groupSchema);

async function createThomasAndPrivateConversation() {
  try {
    await mongoose.connect('mongodb://localhost:27017/lexilis');
    console.log('Connecté à MongoDB');

    // Trouver Théophane
    const theo = await User.findOne({ username: 'theophane_mry' });
    if (!theo) {
      console.log('❌ Théophane non trouvé');
      return;
    }

    // Créer Thomas
    const thomas = new User({
      username: 'thomas_test',
      firstName: 'Thomas',
      lastName: 'Dupont',
      email: 'thomas@test.com',
      password: 'hashedpassword123' // En production, hash this properly
    });

    await thomas.save();
    console.log('👤 Thomas créé:', thomas._id.toString());

    // Créer conversation privée
    const privateConversation = new Group({
      name: `${theo.firstName} et ${thomas.firstName}`,
      isPrivate: true,
      members: [theo._id, thomas._id],
      adminId: theo._id
    });

    await privateConversation.save();
    console.log('💬 Conversation privée créée:', privateConversation._id.toString());
    console.log('🟢 Maintenant vous pouvez tester la suppression d\'historique avec cet ID');

  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createThomasAndPrivateConversation();
