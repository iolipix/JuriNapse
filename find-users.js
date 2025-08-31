const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/config/.env' });

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  followersCount: { type: Number, default: 0 },
  followingCount: { type: Number, default: 0 },
  connectionsCount: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

async function findUsers() {
  try {
    console.log('🔍 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Lister tous les utilisateurs
    const users = await User.find({}, 'username email firstName lastName followersCount followingCount connectionsCount').limit(10);
    
    console.log(`\n👥 Utilisateurs trouvés (${users.length}):`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user.firstName} ${user.lastName})`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Abonnés: ${user.followersCount}, Abonnements: ${user.followingCount}, Connexions: ${user.connectionsCount}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

findUsers();
