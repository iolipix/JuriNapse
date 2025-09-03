const mongoose = require('mongoose');
const User = require('./backend/models/user.model');
const Group = require('./backend/models/group.model');
const Message = require('./backend/models/message.model');

/**
 * Script de diagnostic PRODUCTION pour le compte de Théophane
 * Utilise directement l'URI MongoDB de production
 */

// Configuration MongoDB production (remplacez par votre URI Railway)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://jurinapse-admin:v9nX6gMLnGTF3z@jurinapse.mongodb.net/jurinapse?retryWrites=true&w=majority&appName=JuriNapse';

const diagnosticTheophaneProduction = async () => {
  console.log('🔗 Connexion à MongoDB Production...');
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // L'ID spécifique de theophane_mry
    const theophaneId = '68b25c61a29835348429424a';
    
    console.log(`\n👤 Recherche de l'utilisateur avec l'ID: ${theophaneId}`);
    
    // Récupérer l'utilisateur avec toutes les informations
    const user = await User.findById(theophaneId)
      .populate('following', 'username firstName lastName')
      .populate('followers', 'username firstName lastName')
      .populate('blockedUsers', 'username firstName lastName');

    if (!user) {
      console.log('❌ Utilisateur non trouvé !');
      return;
    }

    console.log('\n=== INFORMATIONS UTILISATEUR ===');
    console.log(`Nom d'utilisateur: ${user.username}`);
    console.log(`Nom complet: ${user.firstName} ${user.lastName}`);
    console.log(`Email: ${user.email}`);
    console.log(`Rôle: ${user.role}`);
    console.log(`Vérifié: ${user.isVerified}`);
    console.log(`Date de création: ${user.createdAt}`);
    console.log(`ID: ${user._id}`);

    console.log('\n=== COMPTEURS ===');
    console.log(`Abonnements (following): ${user.followingCount || 0} (array length: ${user.following?.length || 0})`);
    console.log(`Abonnés (followers): ${user.followersCount || 0} (array length: ${user.followers?.length || 0})`);
    console.log(`Utilisateurs bloqués: ${user.blockedUsers?.length || 0}`);

    console.log('\n=== ABONNEMENTS (Following) ===');
    if (user.following && user.following.length > 0) {
      user.following.forEach((followedUser, index) => {
        console.log(`${index + 1}. ${followedUser.username} (${followedUser.firstName} ${followedUser.lastName}) - ID: ${followedUser._id}`);
      });
    } else {
      console.log('❌ Aucun abonnement trouvé');
    }

    console.log('\n=== ABONNÉS (Followers) ===');
    if (user.followers && user.followers.length > 0) {
      user.followers.forEach((follower, index) => {
        console.log(`${index + 1}. ${follower.username} (${follower.firstName} ${follower.lastName}) - ID: ${follower._id}`);
      });
    } else {
      console.log('❌ Aucun abonné trouvé');
    }

    console.log('\n=== UTILISATEURS BLOQUÉS ===');
    if (user.blockedUsers && user.blockedUsers.length > 0) {
      user.blockedUsers.forEach((blockedUser, index) => {
        console.log(`${index + 1}. ${blockedUser.username} (${blockedUser.firstName} ${blockedUser.lastName}) - ID: ${blockedUser._id}`);
      });
    } else {
      console.log('✅ Aucun utilisateur bloqué');
    }

    // Vérifier les groupes privés (conversations)
    console.log('\n=== GROUPES/CONVERSATIONS ===');
    const groups = await Group.find({
      $or: [
        { members: mongoose.Types.ObjectId(theophaneId) },
        { createdBy: mongoose.Types.ObjectId(theophaneId) }
      ]
    }).populate('members', 'username firstName lastName');

    console.log(`Nombre total de groupes/conversations: ${groups.length}`);
    
    groups.forEach((group, index) => {
      console.log(`\n${index + 1}. ${group.name} (${group.type})`);
      console.log(`   ID: ${group._id}`);
      console.log(`   Créé par: ${group.createdBy}`);
      console.log(`   Membres: ${group.members.length}`);
      group.members.forEach(member => {
        console.log(`   - ${member.username} (${member._id})`);
      });
    });

    // Vérifier les messages récents
    console.log('\n=== MESSAGES RÉCENTS ===');
    const recentMessages = await Message.find({
      sender: mongoose.Types.ObjectId(theophaneId)
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('group', 'name type');

    console.log(`Nombre de messages récents: ${recentMessages.length}`);
    recentMessages.forEach((message, index) => {
      console.log(`${index + 1}. Dans "${message.group?.name}" (${message.group?.type}) - ${new Date(message.createdAt).toLocaleString()}`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    console.log('\n🔐 Déconnexion de MongoDB');
    await mongoose.disconnect();
  }
};

// Exécuter le diagnostic
diagnosticTheophaneProduction().catch(console.error);
