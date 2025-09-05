const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jurinapse';

async function cleanupRolesField() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // 1. Récupérer tous les utilisateurs qui ont encore un champ 'roles'
    const usersWithRolesField = await usersCollection.find({ 
      roles: { $exists: true } 
    }).toArray();

    console.log(`📊 Trouvé ${usersWithRolesField.length} utilisateurs avec le champ 'roles' à nettoyer`);

    for (const user of usersWithRolesField) {
      console.log(`\n👤 Traitement de ${user.username} (${user._id})`);
      console.log(`   Ancien roles array:`, user.roles);
      console.log(`   Actuel role string:`, user.role);

      // Si l'utilisateur a un champ roles mais pas de role string valide
      if (user.roles && (!user.role || user.role === 'user')) {
        // Convertir le array roles en string
        let newRoleString = 'user';
        if (user.roles.length > 0) {
          // Garantir que 'user' est inclus et ordonner correctement
          const roleSet = new Set(['user', ...user.roles]);
          const roleOrder = ['user', 'premium', 'moderator', 'administrator'];
          const orderedRoles = roleOrder.filter(role => roleSet.has(role));
          newRoleString = orderedRoles.join(';');
        }

        await usersCollection.updateOne(
          { _id: user._id },
          { 
            $set: { role: newRoleString },
            $unset: { roles: "" }
          }
        );
        console.log(`   ✅ Mis à jour: role = "${newRoleString}"`);
      } else {
        // Juste supprimer le champ roles si role string existe déjà
        await usersCollection.updateOne(
          { _id: user._id },
          { $unset: { roles: "" } }
        );
        console.log(`   ✅ Supprimé le champ 'roles', gardé role = "${user.role}"`);
      }
    }

    // 2. Vérification spéciale pour Théophane
    const theophane = await usersCollection.findOne({ 
      username: { $regex: /theophane/i } 
    });

    if (theophane) {
      console.log(`\n🎯 THÉOPHANE TROUVÉ: ${theophane.username}`);
      console.log(`   Role actuel: "${theophane.role}"`);
      
      // S'assurer que Théophane a bien user;moderator;administrator
      const desiredRole = 'user;moderator;administrator';
      if (theophane.role !== desiredRole) {
        await usersCollection.updateOne(
          { _id: theophane._id },
          { 
            $set: { role: desiredRole },
            $unset: { roles: "" }
          }
        );
        console.log(`   ✅ Théophane mis à jour: "${desiredRole}"`);
      } else {
        console.log(`   ✅ Théophane déjà correct: "${theophane.role}"`);
      }
    } else {
      console.log('\n⚠️  Utilisateur Théophane non trouvé');
    }

    // 3. Statistiques finales
    const totalUsers = await usersCollection.countDocuments();
    const usersWithOldRoles = await usersCollection.countDocuments({ roles: { $exists: true } });
    
    console.log(`\n📈 STATISTIQUES FINALES:`);
    console.log(`   Total utilisateurs: ${totalUsers}`);
    console.log(`   Utilisateurs avec ancien champ 'roles': ${usersWithOldRoles}`);
    console.log(`   ✅ Nettoyage terminé!`);

    await mongoose.disconnect();
    console.log('✅ Déconnecté de MongoDB');

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

cleanupRolesField();
