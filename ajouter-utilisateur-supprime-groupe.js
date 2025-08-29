const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function ajouterUtilisateurSupprimeAuGroupe() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    const groupsCollection = mongoose.connection.db.collection('groups');
    const usersCollection = mongoose.connection.db.collection('users');
    
    const groupId = '6877ada30f934e0b470cf524'; // Groupe Droit L3
    
    console.log('\n👤 AJOUT DE L\'UTILISATEUR SUPPRIMÉ AU GROUPE');
    console.log('============================================');

    // 1. Trouver l'utilisateur système supprimé
    const deletedUser = await usersCollection.findOne({ 
      username: 'utilisateur_supprime' 
    });
    
    if (!deletedUser) {
      console.log('❌ Utilisateur système "utilisateur_supprime" non trouvé');
      console.log('💡 Il faut d\'abord créer cet utilisateur avec create-deleted-user-system.js');
      return;
    }
    
    console.log(`✅ Utilisateur système trouvé: ${deletedUser._id}`);

    // 2. Vérifier le groupe
    const group = await groupsCollection.findOne({ 
      _id: new mongoose.Types.ObjectId(groupId) 
    });
    
    if (!group) {
      console.log('❌ Groupe non trouvé');
      return;
    }
    
    console.log(`✅ Groupe trouvé: ${group.name}`);
    console.log(`📊 Membres actuels: ${group.members?.length || 0}`);
    
    // 3. Vérifier s'il est déjà membre
    const isMember = group.members?.some(memberId => memberId.toString() === deletedUser._id.toString());
    
    if (isMember) {
      console.log('✅ L\'utilisateur supprimé est déjà membre du groupe');
    } else {
      // 4. Ajouter l'utilisateur supprimé au groupe
      console.log('\n🔧 Ajout de l\'utilisateur supprimé au groupe...');
      
      const result = await groupsCollection.updateOne(
        { _id: new mongoose.Types.ObjectId(groupId) },
        { 
          $addToSet: { 
            members: deletedUser._id 
          } 
        }
      );
      
      if (result.modifiedCount === 1) {
        console.log('✅ Utilisateur supprimé ajouté au groupe avec succès !');
      } else {
        console.log('⚠️ Aucune modification (peut-être déjà membre)');
      }
    }

    // 5. Vérifier les messages de l'utilisateur supprimé dans ce groupe
    const messagesCollection = mongoose.connection.db.collection('messages');
    const messagesCount = await messagesCollection.countDocuments({
      groupId: new mongoose.Types.ObjectId(groupId),
      authorId: deletedUser._id
    });
    
    console.log(`📊 Messages de l'utilisateur supprimé dans ce groupe: ${messagesCount}`);
    
    // 6. Vérifier le résultat final
    const updatedGroup = await groupsCollection.findOne({ 
      _id: new mongoose.Types.ObjectId(groupId) 
    });
    
    console.log(`📊 Nouveaux membres: ${updatedGroup.members?.length || 0}`);
    
    const finalCheck = updatedGroup.members?.some(memberId => memberId.toString() === deletedUser._id.toString());
    console.log(`👤 Utilisateur supprimé est maintenant membre: ${finalCheck ? 'OUI' : 'NON'}`);
    
    if (finalCheck && messagesCount > 0) {
      console.log('\n🎉 SUCCÈS !');
      console.log('✅ L\'utilisateur supprimé est membre du groupe');
      console.log(`✅ ${messagesCount} messages devraient maintenant être visibles`);
      console.log('💡 Les messages apparaîtront comme "Utilisateur Supprimé"');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n📝 Connexion MongoDB fermée');
  }
}

ajouterUtilisateurSupprimeAuGroupe();
