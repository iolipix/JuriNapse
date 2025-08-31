const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/config/.env' });

// Utiliser le modèle User existant
const User = require('./backend/models/user.model.js');

async function debugConnectionsSimple() {
  try {
    console.log('🔍 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Chercher l'utilisateur theophane_mry sans populate
    const user = await User.findOne({ username: 'theophane_mry' });
      
    if (!user) {
      console.log('❌ Utilisateur theophane_mry non trouvé');
      return;
    }

    console.log('\n📊 Données de theophane_mry:');
    console.log(`- followersCount: ${user.followersCount}`);
    console.log(`- followingCount: ${user.followingCount}`);
    console.log(`- connectionsCount: ${user.connectionsCount || 'undefined'}`);
    console.log(`- followers array length: ${user.followers?.length || 0}`);
    console.log(`- following array length: ${user.following?.length || 0}`);

    // Calculer les connexions bidirectionnelles simples
    let actualConnections = 0;
    
    if (user.followers && user.following) {
      for (const followingId of user.following) {
        const isFollowingBack = user.followers.some(followerId => 
          followerId.toString() === followingId.toString()
        );
        if (isFollowingBack) {
          actualConnections++;
        }
      }
    }

    console.log(`\n🔗 Connexions calculées: ${actualConnections}`);

    // Vérifier et corriger les compteurs si nécessaire
    let needsUpdate = false;
    const updateData = {};

    if (user.followersCount !== (user.followers?.length || 0)) {
      console.log(`⚠️ followersCount incorrect: ${user.followersCount} → ${user.followers?.length || 0}`);
      updateData.followersCount = user.followers?.length || 0;
      needsUpdate = true;
    }

    if (user.followingCount !== (user.following?.length || 0)) {
      console.log(`⚠️ followingCount incorrect: ${user.followingCount} → ${user.following?.length || 0}`);
      updateData.followingCount = user.following?.length || 0;
      needsUpdate = true;
    }

    if (user.connectionsCount === undefined || user.connectionsCount !== actualConnections) {
      console.log(`⚠️ connectionsCount incorrect: ${user.connectionsCount || 'undefined'} → ${actualConnections}`);
      updateData.connectionsCount = actualConnections;
      needsUpdate = true;
    }

    if (needsUpdate) {
      console.log('\n🔧 Correction des compteurs...');
      await User.updateOne({ _id: user._id }, { $set: updateData });
      console.log('✅ Compteurs corrigés');
      
      // Vérifier après mise à jour
      const updatedUser = await User.findOne({ username: 'theophane_mry' });
      console.log('\n📊 Compteurs après correction:');
      console.log(`- followersCount: ${updatedUser.followersCount}`);
      console.log(`- followingCount: ${updatedUser.followingCount}`);
      console.log(`- connectionsCount: ${updatedUser.connectionsCount}`);
    } else {
      console.log('\n✅ Tous les compteurs sont corrects');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

debugConnectionsSimple();
