const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

// Ajouter le chemin des models
const path = require('path');
const modelsPath = path.join(__dirname, 'backend', 'models');

async function diagnosticCompletGroupeMessages() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    const Message = require(path.join(modelsPath, 'message.model'));
    const Group = require(path.join(modelsPath, 'group.model'));
    const User = require(path.join(modelsPath, 'user.model'));
    
    const groupId = '6877ada30f934e0b470cf524';
    const userId = '6874ea7cc98b0aa967e09f4d'; // theophane
    
    console.log('\n🔍 DIAGNOSTIC COMPLET GROUPE DROIT L3');
    console.log('====================================');

    // 1. Vérifier le groupe
    console.log('\n1️⃣ VÉRIFICATION DU GROUPE');
    const group = await Group.findById(groupId);
    if (!group) {
      console.log('❌ Groupe non trouvé');
      return;
    }
    
    console.log(`✅ Groupe: ${group.name}`);
    console.log(`📊 Membres: ${group.members.length}`);
    console.log(`👤 Théophane est membre: ${group.members.includes(userId) ? 'OUI' : 'NON'}`);
    
    // Vérifier les paramètres de masquage et suppression d'historique
    const hiddenEntry = group.hiddenForWithTimestamp?.find(h => h.userId.toString() === userId.toString());
    const historyDeletedEntry = group.historyDeletedFor?.find(h => h.userId.toString() === userId.toString());
    
    console.log(`🙈 Conversation masquée: ${hiddenEntry ? 'OUI (' + hiddenEntry.hiddenAt + ')' : 'NON'}`);
    console.log(`🗑️ Historique supprimé: ${historyDeletedEntry ? 'OUI (' + historyDeletedEntry.deletedAt + ')' : 'NON'}`);

    // 2. Compter tous les messages
    console.log('\n2️⃣ COMPTAGE DES MESSAGES');
    const totalMessages = await Message.countDocuments({ groupId });
    console.log(`📊 Total messages dans le groupe: ${totalMessages}`);
    
    // 3. Compter les messages visibles pour l'utilisateur
    let visibleQuery = { groupId };
    if (hiddenEntry) {
      visibleQuery.createdAt = { $gt: hiddenEntry.hiddenAt };
    } else if (historyDeletedEntry) {
      visibleQuery.createdAt = { $gt: historyDeletedEntry.deletedAt };
    }
    
    const visibleMessages = await Message.countDocuments(visibleQuery);
    console.log(`👁️ Messages visibles pour Théophane: ${visibleMessages}`);
    console.log(`🔍 Query utilisée: ${JSON.stringify(visibleQuery)}`);

    // 4. Vérifier les derniers messages
    console.log('\n3️⃣ DERNIERS MESSAGES (sans filtre utilisateur)');
    const recentMessages = await Message.find({ groupId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('authorId', 'username firstName lastName');
    
    console.log(`📊 Messages récents: ${recentMessages.length}`);
    recentMessages.forEach((msg, index) => {
      const authorName = msg.authorId ? 
        (msg.authorId.username || `${msg.authorId.firstName} ${msg.authorId.lastName}`) : 
        'Auteur manquant';
      console.log(`${index + 1}. ${new Date(msg.createdAt).toLocaleString()} - ${authorName}: ${msg.content.substring(0, 50)}...`);
    });

    // 5. Vérifier les messages visibles pour l'utilisateur
    console.log('\n4️⃣ MESSAGES VISIBLES POUR THÉOPHANE');
    const userVisibleMessages = await Message.find(visibleQuery)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('authorId', 'username firstName lastName');
    
    console.log(`📊 Messages visibles: ${userVisibleMessages.length}`);
    if (userVisibleMessages.length === 0) {
      console.log('❌ PROBLÈME: Aucun message visible pour l\'utilisateur');
      
      if (hiddenEntry) {
        console.log(`🔍 Raison: Conversation masquée depuis ${hiddenEntry.hiddenAt}`);
        console.log('💡 Solution: Démasquer la conversation ou ajouter un nouveau message');
      } else if (historyDeletedEntry) {
        console.log(`🔍 Raison: Historique supprimé depuis ${historyDeletedEntry.deletedAt}`);
        console.log('💡 Solution: Réinitialiser la suppression d\'historique ou ajouter un nouveau message');
      }
    } else {
      userVisibleMessages.forEach((msg, index) => {
        const authorName = msg.authorId ? 
          (msg.authorId.username || `${msg.authorId.firstName} ${msg.authorId.lastName}`) : 
          'Auteur manquant';
        console.log(`${index + 1}. ${new Date(msg.createdAt).toLocaleString()} - ${authorName}: ${msg.content.substring(0, 50)}...`);
      });
    }

    // 6. Vérifier l'utilisateur système supprimé
    console.log('\n5️⃣ UTILISATEUR SYSTÈME SUPPRIMÉ');
    const deletedUser = await User.findOne({ username: 'utilisateur_supprime' });
    if (deletedUser) {
      console.log(`✅ Utilisateur système trouvé: ${deletedUser._id}`);
      const messagesFromDeletedUser = await Message.countDocuments({ 
        groupId, 
        authorId: deletedUser._id 
      });
      console.log(`📊 Messages de l'utilisateur supprimé: ${messagesFromDeletedUser}`);
    } else {
      console.log('❌ Utilisateur système manquant');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n📝 Connexion MongoDB fermée');
  }
}

diagnosticCompletGroupeMessages();
