const mongoose = require('mongoose');
const User = require('./backend/models/user.model');

/**
 * Script d'urgence pour restaurer les abonnements de theophane_mry
 * À exécuter directement sur Railway en production
 */

const fixTheophaneSubscriptions = async () => {
  try {
    console.log('🔗 Connexion à MongoDB...');
    
    // L'URI MongoDB sera automatiquement récupérée depuis les variables d'environnement Railway
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI non définie dans les variables d\'environnement');
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    const theophaneId = '68b25c61a29835348429424a';
    
    console.log(`\n👤 Recherche de theophane_mry (${theophaneId})`);
    
    // Récupérer l'utilisateur
    const user = await User.findById(theophaneId);
    
    if (!user) {
      console.log('❌ Utilisateur theophane_mry non trouvé !');
      return;
    }
    
    console.log(`✅ Utilisateur trouvé: ${user.username} (${user.role})`);
    
    // Afficher l'état actuel
    console.log('\n=== ÉTAT ACTUEL ===');
    console.log(`Following: ${user.following?.length || 0} utilisateurs`);
    console.log(`Followers: ${user.followers?.length || 0} utilisateurs`);
    console.log(`FollowingCount: ${user.followingCount || 0}`);
    console.log(`FollowersCount: ${user.followersCount || 0}`);
    console.log(`BlockedUsers: ${user.blockedUsers?.length || 0} utilisateurs`);
    
    // Si les tableaux sont vides ou undefined, essayons de les restaurer
    if (!user.following || user.following.length === 0) {
      console.log('\n⚠️  Le tableau "following" est vide !');
      
      // Chercher d'autres utilisateurs qui suivent theophane pour reconstituer la liste
      console.log('🔍 Recherche des utilisateurs qui avaient des relations avec theophane...');
      
      const usersFollowingTheophane = await User.find({
        following: mongoose.Types.ObjectId(theophaneId)
      }).select('_id username firstName lastName');
      
      console.log(`📊 ${usersFollowingTheophane.length} utilisateurs suivent encore theophane`);
      
      // Ces utilisateurs devraient être dans les followers de theophane
      if (usersFollowingTheophane.length > 0 && (!user.followers || user.followers.length === 0)) {
        console.log('🔧 Restauration des followers...');
        user.followers = usersFollowingTheophane.map(u => u._id);
        user.followersCount = usersFollowingTheophane.length;
      }
      
      // Chercher qui theophane suivait (plus difficile, on peut chercher dans les logs ou deviner)
      const potentialFollowing = await User.find({
        followers: mongoose.Types.ObjectId(theophaneId)
      }).select('_id username firstName lastName');
      
      console.log(`📊 ${potentialFollowing.length} utilisateurs sont encore suivis par theophane`);
      
      if (potentialFollowing.length > 0) {
        console.log('🔧 Restauration des following...');
        user.following = potentialFollowing.map(u => u._id);
        user.followingCount = potentialFollowing.length;
      }
    }
    
    // Sauvegarder les modifications
    if (user.isModified()) {
      console.log('💾 Sauvegarde des modifications...');
      await user.save();
      console.log('✅ Abonnements restaurés !');
    } else {
      console.log('ℹ️  Aucune modification nécessaire');
    }
    
    // Afficher l'état final
    console.log('\n=== ÉTAT FINAL ===');
    const updatedUser = await User.findById(theophaneId);
    console.log(`Following: ${updatedUser.following?.length || 0} utilisateurs`);
    console.log(`Followers: ${updatedUser.followers?.length || 0} utilisateurs`);
    console.log(`FollowingCount: ${updatedUser.followingCount || 0}`);
    console.log(`FollowersCount: ${updatedUser.followersCount || 0}`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    console.log('\n🔐 Déconnexion de MongoDB');
    await mongoose.disconnect();
  }
};

// Exécuter le script
fixTheophaneSubscriptions().catch(console.error);
