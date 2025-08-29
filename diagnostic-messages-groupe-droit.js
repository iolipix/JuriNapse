const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function diagnosticMessagesGroup() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    const messagesCollection = mongoose.connection.db.collection('messages');
    const usersCollection = mongoose.connection.db.collection('users');
    const groupsCollection = mongoose.connection.db.collection('groups');
    
    const groupId = '6877ada30f934e0b470cf524'; // Groupe Droit L3

    console.log('🔍 DIAGNOSTIC MESSAGES GROUPE DROIT L3');
    console.log('=====================================\n');

    // 1. Vérifier que le groupe existe
    const group = await groupsCollection.findOne({ _id: new mongoose.Types.ObjectId(groupId) });
    if (!group) {
      console.log('❌ Le groupe Droit L3 n\'existe pas !');
      return;
    }
    console.log(`✅ Groupe trouvé: ${group.name}`);

    // 2. Compter les messages du groupe
    const totalMessages = await messagesCollection.countDocuments({ 
      groupId: new mongoose.Types.ObjectId(groupId) 
    });
    console.log(`📊 Total messages dans le groupe: ${totalMessages}\n`);

    if (totalMessages === 0) {
      console.log('⚠️ Aucun message dans ce groupe');
      return;
    }

    // 3. Vérifier les messages avec authorId invalides
    console.log('🔍 Vérification des messages avec authorId invalides...');
    const messages = await messagesCollection.find({ 
      groupId: new mongoose.Types.ObjectId(groupId) 
    }).toArray();

    let invalidAuthors = 0;
    const problematicMessages = [];

    for (const message of messages) {
      try {
        if (message.authorId) {
          const author = await usersCollection.findOne({ _id: message.authorId });
          if (!author) {
            console.log(`❌ Message ${message._id} référence un utilisateur inexistant: ${message.authorId}`);
            problematicMessages.push(message);
            invalidAuthors++;
          }
        }
      } catch (e) {
        console.log(`❌ Message ${message._id} a un authorId malformé: ${message.authorId}`);
        problematicMessages.push(message);
        invalidAuthors++;
      }
    }

    console.log(`📊 ${invalidAuthors} messages avec authorId invalide détectés\n`);

    // 4. Vérifier les messages avec sharedPost invalides
    console.log('🔍 Vérification des messages avec sharedPost invalides...');
    const messagesWithSharedPost = messages.filter(msg => msg.sharedPost && msg.sharedPost._id);
    console.log(`📊 ${messagesWithSharedPost.length} messages avec sharedPost trouvés`);

    if (messagesWithSharedPost.length > 0) {
      const postsCollection = mongoose.connection.db.collection('posts');
      for (const message of messagesWithSharedPost) {
        const postExists = await postsCollection.findOne({ _id: message.sharedPost._id });
        if (!postExists) {
          console.log(`❌ Message ${message._id} référence un post inexistant: ${message.sharedPost._id}`);
          problematicMessages.push(message);
        }
      }
    }

    console.log('\n🎯 RÉSUMÉ:');
    if (problematicMessages.length > 0) {
      console.log(`🚨 ${problematicMessages.length} messages problématiques détectés`);
      console.log('💡 Ces messages causent l\'erreur 500 lors du populate()');
      console.log('\n📋 Messages problématiques:');
      problematicMessages.forEach((msg, index) => {
        console.log(`   ${index + 1}. Message: ${msg._id} | Date: ${msg.createdAt} | Author: ${msg.authorId}`);
      });
      
      console.log('\n🔧 SOLUTIONS POSSIBLES:');
      console.log('1. Supprimer ces messages orphelins');
      console.log('2. Remplacer les authorId invalides par un utilisateur par défaut');
      console.log('3. Corriger manuellement les références');
    } else {
      console.log('✅ Tous les messages semblent valides');
      console.log('💡 Le problème vient peut-être d\'ailleurs...');
    }

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n📝 Connexion MongoDB fermée');
  }
}

diagnosticMessagesGroup();
