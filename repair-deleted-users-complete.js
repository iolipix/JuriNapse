// 🔧 RÉPARATION COMPLÈTE - MESSAGES AVEC COMPTES SUPPRIMÉS
const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

// Importer les modèles
const Message = require('./backend/models/message.model');
const User = require('./backend/models/user.model');
const Group = require('./backend/models/group.model');
const Post = require('./backend/models/post.model');
const Reaction = require('./backend/models/reaction.model');

async function repairDeletedUsers() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // 1. Créer ou trouver l'utilisateur système "Utilisateur Supprimé"
    console.log('\n📝 Étape 1: Création utilisateur système...');
    let deletedUser = await User.findOne({ username: 'utilisateur_supprime' });
    
    if (!deletedUser) {
      deletedUser = new User({
        username: 'utilisateur_supprime',
        email: 'deleted@jurinapse.fr',
        password: 'deleted_account',
        firstName: 'Utilisateur',
        lastName: 'Supprimé',
        isDeleted: true,
        university: 'Compte supprimé',
        isStudent: false,
        profilePicture: null
      });
      await deletedUser.save();
      console.log('✅ Utilisateur système créé:', deletedUser._id);
    } else {
      console.log('✅ Utilisateur système existant:', deletedUser._id);
    }

    const deletedUserId = deletedUser._id;

    // 2. Trouver tous les messages avec des authorId orphelins
    console.log('\n🔍 Étape 2: Recherche messages orphelins...');
    const allMessages = await Message.find({}).select('authorId _id');
    console.log(`📊 Total messages: ${allMessages.length}`);
    
    let orphanMessages = [];
    let checkedCount = 0;
    
    for (const message of allMessages) {
      checkedCount++;
      if (checkedCount % 100 === 0) {
        console.log(`   Vérification: ${checkedCount}/${allMessages.length}`);
      }
      
      if (message.authorId) {
        try {
          const author = await User.findById(message.authorId);
          if (!author) {
            orphanMessages.push(message);
          }
        } catch (error) {
          // ID invalide = orphelin
          orphanMessages.push(message);
        }
      }
    }

    console.log(`❌ Messages orphelins trouvés: ${orphanMessages.length}`);

    // 3. Remplacer les références orphelines
    console.log('\n🔧 Étape 3: Réparation des messages orphelins...');
    let repairedCount = 0;
    
    for (const orphanMessage of orphanMessages) {
      await Message.findByIdAndUpdate(
        orphanMessage._id, 
        { authorId: deletedUserId }
      );
      repairedCount++;
      
      if (repairedCount % 10 === 0) {
        console.log(`   Réparé: ${repairedCount}/${orphanMessages.length}`);
      }
    }

    // 4. Réparer les autres collections (Posts, Réactions, etc.)
    console.log('\n🔧 Étape 4: Réparation autres collections...');
    
    // Posts orphelins
    const orphanPosts = await Post.find({}).populate({ path: 'author', options: { strictPopulate: false } });
    let postsRepaired = 0;
    for (const post of orphanPosts) {
      if (!post.author && post.author !== null) {
        await Post.findByIdAndUpdate(post._id, { author: deletedUserId });
        postsRepaired++;
      }
    }
    console.log(`📝 Posts réparés: ${postsRepaired}`);

    // Réactions orphelines
    const orphanReactions = await Reaction.find({}).populate({ path: 'userId', options: { strictPopulate: false } });
    let reactionsRepaired = 0;
    for (const reaction of orphanReactions) {
      if (!reaction.userId && reaction.userId !== null) {
        await Reaction.findByIdAndUpdate(reaction._id, { userId: deletedUserId });
        reactionsRepaired++;
      }
    }
    console.log(`👍 Réactions réparées: ${reactionsRepaired}`);

    // 5. Ajouter l'utilisateur système aux groupes s'il n'y est pas
    console.log('\n👥 Étape 5: Ajout aux groupes...');
    const allGroups = await Group.find({});
    let groupsUpdated = 0;
    
    for (const group of allGroups) {
      if (!group.members.includes(deletedUserId)) {
        await Group.findByIdAndUpdate(
          group._id,
          { $addToSet: { members: deletedUserId } }
        );
        groupsUpdated++;
      }
    }
    console.log(`👥 Groupes mis à jour: ${groupsUpdated}`);

    // 6. Statistiques finales
    console.log('\n📊 RÉPARATION TERMINÉE');
    console.log('========================');
    console.log(`✅ Messages réparés: ${repairedCount}`);
    console.log(`✅ Posts réparés: ${postsRepaired}`);
    console.log(`✅ Réactions réparées: ${reactionsRepaired}`);
    console.log(`✅ Groupes mis à jour: ${groupsUpdated}`);
    console.log(`🆔 ID utilisateur système: ${deletedUserId}`);
    
    // 7. Test final
    console.log('\n🧪 Test final...');
    const testMessage = await Message.findOne({ authorId: deletedUserId })
      .populate({ path: 'authorId', options: { strictPopulate: false } });
    
    if (testMessage && testMessage.authorId) {
      console.log('✅ Test réussi - Les messages s\'affichent correctement');
      console.log(`   Auteur: ${testMessage.authorId.firstName} ${testMessage.authorId.lastName}`);
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

console.log('🚀 DÉMARRAGE RÉPARATION UTILISATEURS SUPPRIMÉS');
console.log('================================================');
repairDeletedUsers();
