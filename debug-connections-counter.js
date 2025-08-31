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

const followSchema = new mongoose.Schema({
  follower: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  following: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);
const Follow = mongoose.model('Follow', followSchema);

async function debugConnectionsCounter() {
  try {
    console.log('🔍 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Chercher l'utilisateur theophane_mry
    const user = await User.findOne({ username: 'theophane_mry' });
    if (!user) {
      console.log('❌ Utilisateur theophane_mry non trouvé');
      return;
    }

    console.log('\n📊 Compteurs actuels de theophane_mry:');
    console.log(`- followersCount: ${user.followersCount}`);
    console.log(`- followingCount: ${user.followingCount}`);
    console.log(`- connectionsCount: ${user.connectionsCount}`);

    // Vérifier les relations Follow où theophane_mry est follower
    const followingRelations = await Follow.find({ follower: user._id }).populate('following', 'username firstName lastName');
    console.log(`\n👥 Utilisateurs que theophane_mry suit (${followingRelations.length}):`);
    followingRelations.forEach(relation => {
      console.log(`- ${relation.following.username} (${relation.following.firstName} ${relation.following.lastName})`);
    });

    // Vérifier les relations Follow où theophane_mry est suivi
    const followerRelations = await Follow.find({ following: user._id }).populate('follower', 'username firstName lastName');
    console.log(`\n👥 Utilisateurs qui suivent theophane_mry (${followerRelations.length}):`);
    followerRelations.forEach(relation => {
      console.log(`- ${relation.follower.username} (${relation.follower.firstName} ${relation.follower.lastName})`);
    });

    // Calculer les connexions bidirectionnelles
    console.log('\n🔗 Analyse des connexions bidirectionnelles:');
    let actualConnections = 0;
    const connections = [];

    for (const following of followingRelations) {
      // Vérifier si cette personne suit aussi theophane_mry en retour
      const mutualFollow = followerRelations.find(f => f.follower._id.toString() === following.following._id.toString());
      if (mutualFollow) {
        actualConnections++;
        connections.push(following.following.username);
        console.log(`✅ Connexion mutuelle avec: ${following.following.username}`);
      }
    }

    console.log(`\n📈 Résumé des compteurs:`);
    console.log(`- Abonnés réels: ${followerRelations.length}`);
    console.log(`- Abonnements réels: ${followingRelations.length}`);
    console.log(`- Connexions réelles: ${actualConnections}`);
    console.log(`- Connexions stockées: ${user.connectionsCount}`);

    if (user.connectionsCount !== actualConnections) {
      console.log(`\n⚠️ PROBLÈME DÉTECTÉ: Le compteur de connexions (${user.connectionsCount}) ne correspond pas au nombre réel (${actualConnections})`);
      console.log('🔧 Correction du compteur...');
      
      await User.updateOne(
        { _id: user._id },
        { $set: { connectionsCount: actualConnections } }
      );
      
      console.log(`✅ Compteur de connexions corrigé: ${user.connectionsCount} → ${actualConnections}`);
    } else {
      console.log('\n✅ Le compteur de connexions est correct');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

debugConnectionsCounter();
