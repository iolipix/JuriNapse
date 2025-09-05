const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jurinapse';

async function fixManonRoles() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // 1. Chercher Manon
    const manon = await usersCollection.findOne({ 
      username: { $regex: /manon/i }
    });

    if (!manon) {
      console.log('❌ Utilisateur Manon non trouvé');
      
      // Lister quelques utilisateurs pour aider à la recherche
      const users = await usersCollection.find({}, { username: 1, role: 1 }).limit(10).toArray();
      console.log('\n📋 Quelques utilisateurs dans la base:');
      users.forEach(user => {
        console.log(`  - ${user.username}: "${user.role}"`);
      });
      
      await mongoose.disconnect();
      return;
    }

    console.log(`\n👤 MANON TROUVÉE: ${manon.username}`);
    console.log(`   Role actuel: "${manon.role}"`);
    console.log(`   ID: ${manon._id}`);

    // 2. Vérifier et corriger le rôle de Manon
    let needsUpdate = false;
    let newRole = manon.role;

    if (manon.role === 'moderator') {
      // Manon a seulement "moderator", doit être "user;moderator"
      newRole = 'user;moderator';
      needsUpdate = true;
      console.log(`   ⚠️  Problème détecté: role="${manon.role}" (manque "user")`);
    } else if (manon.role && !manon.role.includes('user')) {
      // Manon a des rôles mais pas "user"
      const roles = manon.role.split(';').map(r => r.trim()).filter(Boolean);
      if (!roles.includes('user')) {
        roles.unshift('user');
        const roleOrder = ['user', 'premium', 'moderator', 'administrator'];
        const orderedRoles = roleOrder.filter(role => roles.includes(role));
        newRole = orderedRoles.join(';');
        needsUpdate = true;
        console.log(`   ⚠️  Problème détecté: role="${manon.role}" (manque "user")`);
      }
    } else {
      console.log(`   ✅ Rôle correct: "${manon.role}"`);
    }

    // 3. Mettre à jour si nécessaire
    if (needsUpdate) {
      await usersCollection.updateOne(
        { _id: manon._id },
        { 
          $set: { role: newRole },
          $unset: { roles: "" } // Nettoyer aussi l'ancien champ
        }
      );
      console.log(`   ✅ Manon mise à jour: "${newRole}"`);
    }

    // 4. Vérifier d'autres utilisateurs avec des rôles incorrects
    console.log('\n🔍 Vérification d\'autres utilisateurs avec des rôles sans "user":');
    const usersWithoutUser = await usersCollection.find({
      $and: [
        { role: { $exists: true } },
        { role: { $ne: 'user' } },
        { role: { $not: { $regex: '^user' } } } // Ne commence pas par "user"
      ]
    }).toArray();

    if (usersWithoutUser.length > 0) {
      console.log(`   ⚠️  Trouvé ${usersWithoutUser.length} utilisateur(s) avec des rôles sans "user":`);
      
      for (const user of usersWithoutUser) {
        console.log(`     - ${user.username}: "${user.role}"`);
        
        // Corriger automatiquement
        const roles = user.role.split(';').map(r => r.trim()).filter(Boolean);
        if (!roles.includes('user')) {
          roles.unshift('user');
          const roleOrder = ['user', 'premium', 'moderator', 'administrator'];
          const orderedRoles = roleOrder.filter(role => roles.includes(role));
          const correctedRole = orderedRoles.join(';');
          
          await usersCollection.updateOne(
            { _id: user._id },
            { 
              $set: { role: correctedRole },
              $unset: { roles: "" }
            }
          );
          console.log(`     ✅ Corrigé: "${correctedRole}"`);
        }
      }
    } else {
      console.log(`   ✅ Tous les autres utilisateurs ont des rôles corrects`);
    }

    console.log('\n📈 VÉRIFICATION FINALE:');
    const manonFinal = await usersCollection.findOne({ username: { $regex: /manon/i } });
    if (manonFinal) {
      console.log(`   Manon: "${manonFinal.role}"`);
    }

    const theophane = await usersCollection.findOne({ username: { $regex: /theophane/i } });
    if (theophane) {
      console.log(`   Théophane: "${theophane.role}"`);
    }

    await mongoose.disconnect();
    console.log('✅ Déconnecté de MongoDB');

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

fixManonRoles();
