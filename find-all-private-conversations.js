// Chercher toutes les conversations privées avec 2 membres
const mongoose = require('mongoose');

async function findAllPrivateConversations() {
  try {
    await mongoose.connect('mongodb://localhost:27017/lexilis');
    console.log('Connecté à MongoDB');

    const Group = mongoose.model('Group', new mongoose.Schema({}, { strict: false }));
    
    // Chercher tous les groupes privés
    const privateGroups = await Group.find({ 
      isPrivate: true 
    }).populate('members');

    console.log(`=== CONVERSATIONS PRIVÉES (${privateGroups.length}) ===`);
    
    privateGroups.forEach((group, index) => {
      console.log(`${index + 1}. ID: ${group._id.toString()}`);
      console.log(`   Nom: ${group.name}`);
      console.log(`   Description: ${group.description}`);
      console.log(`   Membres: ${group.members.length}`);
      console.log(`   AdminId: ${group.adminId?.toString()}`);
      console.log('---');
    });

    // Chercher aussi tous les groupes (privés ou non) au cas où
    const allGroups = await Group.find({}).populate('members');
    console.log(`\n=== TOUS LES GROUPES (${allGroups.length}) ===`);
    
    allGroups.forEach((group, index) => {
      console.log(`${index + 1}. ID: ${group._id.toString()}`);
      console.log(`   Nom: ${group.name}`);
      console.log(`   Privé: ${group.isPrivate}`);
      console.log(`   Membres: ${group.members.length}`);
      if (group._id.toString() === '68b3839897500925dc9234a6') {
        console.log('   🎯 CELUI-CI CORRESPOND À VOTRE ID!');
      }
      console.log('---');
    });

  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await mongoose.disconnect();
  }
}

findAllPrivateConversations();
