const mongoose = require('mongoose');
const User = require('../models/user.model');
const Group = require('../models/group.model');
const Message = require('../models/message.model');
require('dotenv').config({ path: '../config/.env' });

/**
 * Script de diagnostic pour le compte de Théophane
 */
const diagnosticTheophane = async () => {
  try {
    console.log('🔗 Connexion à MongoDB...');
    
    // Utiliser l'URI de production
    const MONGODB_URI = 'mongodb+srv://jurinapse:VYfN6m0fMuBPMBZc@jurinapse.mongodb.net/jurinapse?retryWrites=true&w=majority&appName=JuriNapse';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Trouver Théophane
    const theophane = await User.findById('68b25c61a29835348429424a');
    
    if (!theophane) {
      console.log('❌ Utilisateur Théophane non trouvé');
      return;
    }

    console.log('\n📋 DIAGNOSTIC COMPTE THÉOPHANE');
    console.log('=================================');
    console.log(`👤 Username: ${theophane.username}`);
    console.log(`📧 Email: ${theophane.email}`);
    console.log(`🎯 Rôle: ${theophane.role || 'user'}`);
    console.log(`📊 Actif: ${theophane.isActive}`);
    
    // Compteurs d'abonnements
    console.log('\n📊 ABONNEMENTS');
    console.log('===============');
    console.log(`👥 Abonnés: ${theophane.followersCount || 0} (liste: ${theophane.followers?.length || 0})`);
    console.log(`➡️  Abonnements: ${theophane.followingCount || 0} (liste: ${theophane.following?.length || 0})`);
    
    // Groupes dont il est membre
    console.log('\n💬 GROUPES/CONVERSATIONS');
    console.log('=========================');
    const groups = await Group.find({
      members: theophane._id
    }).select('name isPrivate members createdAt');
    
    console.log(`📝 Membre de ${groups.length} groupes/conversations:`);
    groups.forEach((group, index) => {
      const type = group.isPrivate ? '🔒 Privé' : '👥 Groupe';
      console.log(`  ${index + 1}. ${type} - ${group.name || 'Sans nom'} (${group.members.length} membres)`);
    });
    
    // Messages récents
    console.log('\n✉️  MESSAGES RÉCENTS');
    console.log('=====================');
    const recentMessages = await Message.find({
      authorId: theophane._id
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('content groupId createdAt');
    
    console.log(`📤 ${recentMessages.length} messages récents:`);
    recentMessages.forEach((msg, index) => {
      const preview = msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : '');
      console.log(`  ${index + 1}. "${preview}" (${msg.createdAt.toISOString()})`);
    });
    
    // Vérifier s'il y a des données manquantes
    console.log('\n🔍 VÉRIFICATIONS');
    console.log('=================');
    
    if (theophane.following && theophane.following.length > 0) {
      console.log('✅ Liste des abonnements présente');
    } else {
      console.log('⚠️  Liste des abonnements vide');
    }
    
    if (theophane.followers && theophane.followers.length > 0) {
      console.log('✅ Liste des abonnés présente');
    } else {
      console.log('⚠️  Liste des abonnés vide');
    }
    
    if (groups.length > 0) {
      console.log('✅ Conversations présentes');
    } else {
      console.log('⚠️  Aucune conversation trouvée');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔐 Déconnexion de MongoDB');
    process.exit(0);
  }
};

diagnosticTheophane();
