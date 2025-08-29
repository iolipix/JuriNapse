const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function ajouterTheophaneAuGroupe() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    const groupsCollection = mongoose.connection.db.collection('groups');
    const usersCollection = mongoose.connection.db.collection('users');
    
    const groupId = '6877ada30f934e0b470cf524';
    const userId = '6874ea7cc98b0aa967e09f4d'; // theophane
    
    console.log('\n👥 AJOUT DE THÉOPHANE AU GROUPE DROIT L3');
    console.log('=======================================');

    // 1. Vérifier que l'utilisateur existe
    const user = await usersCollection.findOne({ 
      _id: new mongoose.Types.ObjectId(userId) 
    });
    
    if (!user) {
      console.log('❌ Utilisateur Théophane non trouvé');
      return;
    }
    
    console.log(`✅ Utilisateur trouvé: ${user.username} (${user.firstName} ${user.lastName})`);

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
    const isMember = group.members?.some(memberId => memberId.toString() === userId);
    
    if (isMember) {
      console.log('✅ Théophane est déjà membre du groupe');
      return;
    }
    
    // 4. Ajouter Théophane au groupe
    console.log('\n🔧 Ajout de Théophane au groupe...');
    
    const result = await groupsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(groupId) },
      { 
        $addToSet: { 
          members: new mongoose.Types.ObjectId(userId) 
        } 
      }
    );
    
    if (result.modifiedCount === 1) {
      console.log('✅ Théophane a été ajouté au groupe avec succès !');
      
      // 5. Vérifier le résultat
      const updatedGroup = await groupsCollection.findOne({ 
        _id: new mongoose.Types.ObjectId(groupId) 
      });
      
      console.log(`📊 Nouveaux membres: ${updatedGroup.members?.length || 0}`);
      
      const nowMember = updatedGroup.members?.some(memberId => memberId.toString() === userId);
      console.log(`👤 Théophane est maintenant membre: ${nowMember ? 'OUI' : 'NON'}`);
      
    } else {
      console.log('❌ Échec de l\'ajout au groupe');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n📝 Connexion MongoDB fermée');
  }
}

ajouterTheophaneAuGroupe();
