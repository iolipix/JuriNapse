const { MongoClient } = require('mongodb');
require('dotenv').config({ path: './backend/.env' });

async function diagnosticMongoDB() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    console.log('🔌 Connexion à MongoDB...');
    await client.connect();
    console.log('✅ Connecté à MongoDB');

    const db = client.db();
    const messagesCollection = db.collection('messages');
    const groupsCollection = db.collection('groups');
    const usersCollection = db.collection('users');
    
    const groupId = '6877ada30f934e0b470cf524';
    const userId = '6874ea7cc98b0aa967e09f4d'; // theophane
    
    console.log('\n🔍 DIAGNOSTIC COMPLET GROUPE DROIT L3');
    console.log('====================================');

    // 1. Vérifier le groupe
    console.log('\n1️⃣ VÉRIFICATION DU GROUPE');
    const { ObjectId } = require('mongodb');
    const group = await groupsCollection.findOne({ _id: new ObjectId(groupId) });
    
    if (!group) {
      console.log('❌ Groupe non trouvé');
      return;
    }
    
    console.log(`✅ Groupe: ${group.name}`);
    console.log(`📊 Membres: ${group.members.length}`);
    
    const isMember = group.members.some(memberId => memberId.toString() === userId);
    console.log(`👤 Théophane est membre: ${isMember ? 'OUI' : 'NON'}`);
    
    // Vérifier les paramètres de masquage et suppression d'historique
    const hiddenEntry = group.hiddenForWithTimestamp?.find(h => h.userId.toString() === userId);
    const historyDeletedEntry = group.historyDeletedFor?.find(h => h.userId.toString() === userId);
    
    console.log(`🙈 Conversation masquée: ${hiddenEntry ? 'OUI (' + hiddenEntry.hiddenAt + ')' : 'NON'}`);
    console.log(`🗑️ Historique supprimé: ${historyDeletedEntry ? 'OUI (' + historyDeletedEntry.deletedAt + ')' : 'NON'}`);

    // 2. Compter tous les messages
    console.log('\n2️⃣ COMPTAGE DES MESSAGES');
    const totalMessages = await messagesCollection.countDocuments({ groupId: new ObjectId(groupId) });
    console.log(`📊 Total messages dans le groupe: ${totalMessages}`);
    
    // 3. Compter les messages visibles pour l'utilisateur
    let visibleQuery = { groupId: new ObjectId(groupId) };
    if (hiddenEntry) {
      visibleQuery.createdAt = { $gt: hiddenEntry.hiddenAt };
    } else if (historyDeletedEntry) {
      visibleQuery.createdAt = { $gt: historyDeletedEntry.deletedAt };
    }
    
    const visibleMessages = await messagesCollection.countDocuments(visibleQuery);
    console.log(`👁️ Messages visibles pour Théophane: ${visibleMessages}`);
    console.log(`🔍 Query utilisée: ${JSON.stringify(visibleQuery, null, 2)}`);

    // 4. Vérifier les derniers messages (sans populate pour simplifier)
    console.log('\n3️⃣ DERNIERS MESSAGES (sans filtre utilisateur)');
    const recentMessages = await messagesCollection.find({ groupId: new ObjectId(groupId) })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
    
    console.log(`📊 Messages récents: ${recentMessages.length}`);
    recentMessages.forEach((msg, index) => {
      console.log(`${index + 1}. ${new Date(msg.createdAt).toLocaleString()} - AuthorId: ${msg.authorId}: ${msg.content.substring(0, 50)}...`);
    });

    // 5. Vérifier les messages visibles pour l'utilisateur
    console.log('\n4️⃣ MESSAGES VISIBLES POUR THÉOPHANE');
    const userVisibleMessages = await messagesCollection.find(visibleQuery)
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
    
    console.log(`📊 Messages visibles: ${userVisibleMessages.length}`);
    if (userVisibleMessages.length === 0) {
      console.log('❌ PROBLÈME IDENTIFIÉ: Aucun message visible pour l\'utilisateur');
      
      if (hiddenEntry) {
        console.log(`🔍 Raison: Conversation masquée depuis ${hiddenEntry.hiddenAt}`);
        console.log('💡 Solution: Démasquer la conversation');
      } else if (historyDeletedEntry) {
        console.log(`🔍 Raison: Historique supprimé depuis ${historyDeletedEntry.deletedAt}`);
        console.log('💡 Solution: Réinitialiser la suppression d\'historique');
      } else {
        console.log('🔍 Raison inconnue - vérifier les filtres');
      }
    } else {
      userVisibleMessages.forEach((msg, index) => {
        console.log(`${index + 1}. ${new Date(msg.createdAt).toLocaleString()} - AuthorId: ${msg.authorId}: ${msg.content.substring(0, 50)}...`);
      });
    }

    // 6. Vérifier l'utilisateur système supprimé
    console.log('\n5️⃣ UTILISATEUR SYSTÈME SUPPRIMÉ');
    const deletedUser = await usersCollection.findOne({ username: 'utilisateur_supprime' });
    if (deletedUser) {
      console.log(`✅ Utilisateur système trouvé: ${deletedUser._id}`);
      const messagesFromDeletedUser = await messagesCollection.countDocuments({ 
        groupId: new ObjectId(groupId),
        authorId: deletedUser._id 
      });
      console.log(`📊 Messages de l'utilisateur supprimé: ${messagesFromDeletedUser}`);
    } else {
      console.log('❌ Utilisateur système manquant');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.close();
    console.log('\n📝 Connexion MongoDB fermée');
  }
}

diagnosticMongoDB();
