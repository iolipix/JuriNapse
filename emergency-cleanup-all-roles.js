const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jurinapse';

async function emergencyCleanupRoles() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    console.log('\n🔍 ÉTAPE 1: État actuel de la base');
    
    // Vérifier Théophane spécifiquement
    const theophane = await usersCollection.findOne({ 
      username: { $regex: /theophane/i }
    });

    if (theophane) {
      console.log(`\n👤 THÉOPHANE ACTUEL:`);
      console.log(`   Username: ${theophane.username}`);
      console.log(`   Role (string): "${theophane.role}"`);
      console.log(`   Roles (array): ${JSON.stringify(theophane.roles)}`);
    }

    // Vérifier Manon
    const manon = await usersCollection.findOne({ 
      username: { $regex: /manon/i }
    });

    if (manon) {
      console.log(`\n👤 MANON ACTUELLE:`);
      console.log(`   Username: ${manon.username}`);
      console.log(`   Role (string): "${manon.role}"`);
      console.log(`   Roles (array): ${JSON.stringify(manon.roles)}`);
    }

    // Compter tous les utilisateurs avec l'ancien champ roles
    const usersWithRolesArray = await usersCollection.countDocuments({ 
      roles: { $exists: true } 
    });
    console.log(`\n📊 Utilisateurs avec ancien champ 'roles': ${usersWithRolesArray}`);

    console.log('\n🧹 ÉTAPE 2: NETTOYAGE COMPLET');

    // 1. SUPPRIMER TOUS LES CHAMPS 'roles' (array)
    const deleteResult = await usersCollection.updateMany(
      { roles: { $exists: true } },
      { $unset: { roles: "" } }
    );
    console.log(`   ✅ Supprimé le champ 'roles' de ${deleteResult.modifiedCount} utilisateurs`);

    // 2. CORRIGER THÉOPHANE - lui donner user;moderator;administrator
    if (theophane) {
      await usersCollection.updateOne(
        { _id: theophane._id },
        { $set: { role: "user;moderator;administrator" } }
      );
      console.log(`   ✅ Théophane corrigé: "user;moderator;administrator"`);
    }

    // 3. CORRIGER MANON - lui donner user;moderator
    if (manon) {
      await usersCollection.updateOne(
        { _id: manon._id },
        { $set: { role: "user;moderator" } }
      );
      console.log(`   ✅ Manon corrigée: "user;moderator"`);
    }

    // 4. CORRIGER TOUS LES AUTRES UTILISATEURS
    console.log('\n🔧 ÉTAPE 3: Correction de tous les rôles incomplets');

    // Utilisateurs avec juste "administrator"
    const adminOnlyResult = await usersCollection.updateMany(
      { role: "administrator" },
      { $set: { role: "user;administrator" } }
    );
    console.log(`   ✅ Corrigé ${adminOnlyResult.modifiedCount} admin(s): "administrator" → "user;administrator"`);

    // Utilisateurs avec juste "moderator"
    const modOnlyResult = await usersCollection.updateMany(
      { role: "moderator" },
      { $set: { role: "user;moderator" } }
    );
    console.log(`   ✅ Corrigé ${modOnlyResult.modifiedCount} modérateur(s): "moderator" → "user;moderator"`);

    // Utilisateurs avec juste "premium"
    const premiumOnlyResult = await usersCollection.updateMany(
      { role: "premium" },
      { $set: { role: "user;premium" } }
    );
    console.log(`   ✅ Corrigé ${premiumOnlyResult.modifiedCount} premium(s): "premium" → "user;premium"`);

    console.log('\n📈 ÉTAPE 4: VÉRIFICATION FINALE');

    // Vérifier l'état final
    const theophaneAfter = await usersCollection.findOne({ 
      username: { $regex: /theophane/i }
    });
    if (theophaneAfter) {
      console.log(`   👑 Théophane final: "${theophaneAfter.role}"`);
    }

    const manonAfter = await usersCollection.findOne({ 
      username: { $regex: /manon/i }
    });
    if (manonAfter) {
      console.log(`   🛡️ Manon finale: "${manonAfter.role}"`);
    }

    // Compter les utilisateurs par type de rôle
    const roleStats = await usersCollection.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    console.log('\n📊 Statistiques des rôles:');
    roleStats.forEach(stat => {
      console.log(`   "${stat._id}": ${stat.count} utilisateur(s)`);
    });

    // Vérifier qu'il n'y a plus de champ roles
    const remainingRoles = await usersCollection.countDocuments({ 
      roles: { $exists: true } 
    });
    console.log(`\n✅ Champs 'roles' restants: ${remainingRoles} (doit être 0)`);

    await mongoose.disconnect();
    console.log('\n🎉 NETTOYAGE TERMINÉ !');

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

emergencyCleanupRoles();
