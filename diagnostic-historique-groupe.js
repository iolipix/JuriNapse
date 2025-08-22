const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function diagnosticHistoriqueGroupe() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    const messagesCollection = mongoose.connection.db.collection('messages');
    const groupsCollection = mongoose.connection.db.collection('groups');
    
    const groupId = '6877ada30f934e0b470cf524';
    const userId = '6874ea7cc98b0aa967e09f4d'; // theophane
    
    console.log('\n🔍 DIAGNOSTIC HISTORIQUE GROUPE DROIT L3');
    console.log('======================================');

    // 1. Vérifier le groupe et ses paramètres
    console.log('\n1️⃣ PARAMÈTRES DU GROUPE');
    const group = await groupsCollection.findOne({ 
      _id: new mongoose.Types.ObjectId(groupId) 
    });
    
    if (!group) {
      console.log('❌ Groupe non trouvé');
      return;
    }
    
    console.log(`✅ Groupe: ${group.name}`);
    console.log(`📊 Membres: ${group.members?.length || 0}`);
    
    // Vérifier si theophane est membre
    const isMember = group.members?.some(memberId => memberId.toString() === userId);
    console.log(`👤 Théophane est membre: ${isMember ? 'OUI' : 'NON'}`);
    
    // Vérifier les paramètres de masquage
    console.log('\n2️⃣ PARAMÈTRES DE MASQUAGE');
    console.log('hiddenFor:', group.hiddenFor || []);
    console.log('hiddenForWithTimestamp:', group.hiddenForWithTimestamp || []);
    
    const hiddenEntry = group.hiddenForWithTimestamp?.find(h => 
      h.userId.toString() === userId
    );
    
    if (hiddenEntry) {
      console.log(`🙈 CONVERSATION MASQUÉE pour Théophane depuis: ${hiddenEntry.hiddenAt}`);
    } else {
      console.log(`✅ Conversation PAS masquée pour Théophane`);
    }
    
    // Vérifier les paramètres de suppression d'historique
    console.log('\n3️⃣ PARAMÈTRES DE SUPPRESSION D\'HISTORIQUE');
    console.log('historyDeletedFor:', group.historyDeletedFor || []);
    
    const historyDeletedEntry = group.historyDeletedFor?.find(h => 
      h.userId.toString() === userId
    );
    
    if (historyDeletedEntry) {
      console.log(`🗑️ HISTORIQUE SUPPRIMÉ pour Théophane depuis: ${historyDeletedEntry.deletedAt}`);
    } else {
      console.log(`✅ Historique PAS supprimé pour Théophane`);
    }

    // 4. Tester les requêtes de messages
    console.log('\n4️⃣ TEST DES REQUÊTES MESSAGES');
    
    // Query sans filtre
    const totalMessages = await messagesCollection.countDocuments({ 
      groupId: new mongoose.Types.ObjectId(groupId) 
    });
    console.log(`📊 Total messages: ${totalMessages}`);
    
    // Query avec filtres appliqués
    let filteredQuery = { groupId: new mongoose.Types.ObjectId(groupId) };
    
    if (hiddenEntry) {
      filteredQuery.createdAt = { $gt: hiddenEntry.hiddenAt };
      console.log(`🔍 Filtre appliqué (masquage): messages après ${hiddenEntry.hiddenAt}`);
    } else if (historyDeletedEntry) {
      filteredQuery.createdAt = { $gt: historyDeletedEntry.deletedAt };
      console.log(`🔍 Filtre appliqué (suppression): messages après ${historyDeletedEntry.deletedAt}`);
    } else {
      console.log(`🔍 Aucun filtre temporel appliqué`);
    }
    
    console.log(`🔍 Query finale: ${JSON.stringify(filteredQuery, null, 2)}`);
    
    const visibleMessages = await messagesCollection.countDocuments(filteredQuery);
    console.log(`👁️ Messages visibles avec filtres: ${visibleMessages}`);
    
    // Afficher les dates des messages pour comprendre
    console.log('\n5️⃣ ANALYSE TEMPORELLE');
    const firstMessage = await messagesCollection.findOne(
      { groupId: new mongoose.Types.ObjectId(groupId) },
      { sort: { createdAt: 1 } }
    );
    const lastMessage = await messagesCollection.findOne(
      { groupId: new mongoose.Types.ObjectId(groupId) },
      { sort: { createdAt: -1 } }
    );
    
    if (firstMessage) {
      console.log(`📅 Premier message: ${firstMessage.createdAt}`);
    }
    if (lastMessage) {
      console.log(`📅 Dernier message: ${lastMessage.createdAt}`);
    }
    
    if (hiddenEntry) {
      console.log(`📅 Date de masquage: ${hiddenEntry.hiddenAt}`);
      console.log(`❓ Masquage après dernier message: ${hiddenEntry.hiddenAt > lastMessage.createdAt}`);
    }
    
    if (historyDeletedEntry) {
      console.log(`📅 Date suppression historique: ${historyDeletedEntry.deletedAt}`);
      console.log(`❓ Suppression après dernier message: ${historyDeletedEntry.deletedAt > lastMessage.createdAt}`);
    }

    // 6. Solution proposée
    console.log('\n6️⃣ DIAGNOSTIC ET SOLUTION');
    if (visibleMessages === 0) {
      console.log('❌ PROBLÈME CONFIRMÉ: Aucun message visible');
      
      if (hiddenEntry) {
        console.log('💡 SOLUTION: Supprimer l\'entrée de masquage');
        console.log(`   Exécuter: db.groups.updateOne({_id: ObjectId("${groupId}")}, {$pull: {hiddenForWithTimestamp: {userId: ObjectId("${userId}")}}})`);
      } else if (historyDeletedEntry) {
        console.log('💡 SOLUTION: Supprimer l\'entrée de suppression d\'historique');
        console.log(`   Exécuter: db.groups.updateOne({_id: ObjectId("${groupId}")}, {$pull: {historyDeletedFor: {userId: ObjectId("${userId}")}}})`);
      }
    } else {
      console.log('✅ Messages visibles - le problème pourrait être ailleurs');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n📝 Connexion MongoDB fermée');
  }
}

diagnosticHistoriqueGroupe();
