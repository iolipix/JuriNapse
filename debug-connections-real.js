const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/config/.env' });

// Utiliser le modèle User existant
const User = require('./backend/models/user.model.js');

async function debugConnectionsCounterReal() {
  try {
    console.log('🔍 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Chercher l'utilisateur theophane_mry
    const user = await User.findOne({ username: 'theophane_mry' })
      .populate('followers', 'username firstName lastName')
      .populate('following', 'username firstName lastName');
      
    if (!user) {
      console.log('❌ Utilisateur theophane_mry non trouvé');
      return;
    }

    console.log('\n📊 Compteurs actuels de theophane_mry:');
    console.log(`- followersCount: ${user.followersCount}`);
    console.log(`- followingCount: ${user.followingCount}`);
    console.log(`- connectionsCount: ${user.connectionsCount || 'undefined'}`);

    console.log(`\n👥 Utilisateurs qui suivent theophane_mry (${user.followers.length}):`);
    user.followers.forEach(follower => {
      console.log(`- ${follower.username} (${follower.firstName} ${follower.lastName})`);
    });

    console.log(`\n👥 Utilisateurs que theophane_mry suit (${user.following.length}):`);
    user.following.forEach(following => {
      console.log(`- ${following.username} (${following.firstName} ${following.lastName})`);
    });

    // Calculer les connexions bidirectionnelles
    console.log('\n🔗 Analyse des connexions bidirectionnelles:');
    let actualConnections = 0;
    const connections = [];

    for (const followingUser of user.following) {
      // Vérifier si cette personne suit aussi theophane_mry en retour
      const mutualFollow = user.followers.find(f => f._id.toString() === followingUser._id.toString());
      if (mutualFollow) {
        actualConnections++;
        connections.push(followingUser.username);
        console.log(`✅ Connexion mutuelle avec: ${followingUser.username}`);
      } else {
        console.log(`⏸️ Suivi non mutuel avec: ${followingUser.username}`);
      }
    }

    console.log(`\n📈 Résumé des compteurs:`);
    console.log(`- Abonnés réels: ${user.followers.length}`);
    console.log(`- Abonnements réels: ${user.following.length}`);
    console.log(`- Connexions réelles: ${actualConnections}`);
    console.log(`- Connexions stockées: ${user.connectionsCount || 'non défini'}`);

    // Vérifier si les compteurs sont corrects
    if (user.followersCount !== user.followers.length) {
      console.log(`\n⚠️ PROBLÈME: followersCount (${user.followersCount}) ≠ followers.length (${user.followers.length})`);
    }
    if (user.followingCount !== user.following.length) {
      console.log(`\n⚠️ PROBLÈME: followingCount (${user.followingCount}) ≠ following.length (${user.following.length})`);
    }

    // Ajouter le champ connectionsCount s'il n'existe pas
    if (user.connectionsCount === undefined) {
      console.log(`\n🔧 Ajout du champ connectionsCount manquant...`);
      await User.updateOne(
        { _id: user._id },
        { $set: { connectionsCount: actualConnections } }
      );
      console.log(`✅ Champ connectionsCount ajouté: ${actualConnections}`);
    } else if (user.connectionsCount !== actualConnections) {
      console.log(`\n🔧 Correction du compteur connectionsCount...`);
      await User.updateOne(
        { _id: user._id },
        { $set: { connectionsCount: actualConnections } }
      );
      console.log(`✅ Compteur connectionsCount corrigé: ${user.connectionsCount} → ${actualConnections}`);
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

debugConnectionsCounterReal();
