const mongoose = require('mongoose');
const User = require('../models/user.model');

async function migrateRolesOnStartup() {
  try {
    console.log('🔄 Début de la migration automatique des rôles...');
    
    // Trouver tous les utilisateurs avec l'ancien système de rôles
    const usersWithOldRoles = await User.find({
      $or: [
        { roles: { $exists: true } },
        { role: { $exists: false } },
        { role: '' },
        { role: null }
      ]
    });

    console.log(`📊 ${usersWithOldRoles.length} utilisateurs à migrer`);

    let migratedCount = 0;
    const updates = [];

    for (const user of usersWithOldRoles) {
      let newRole = 'user';
      
      // Si l'utilisateur a des rôles dans l'ancien champ
      if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
        const allRoles = ['user', ...user.roles];
        newRole = [...new Set(allRoles)].join(';');
      }
      // Si l'utilisateur a déjà un rôle mais incomplet
      else if (user.role && typeof user.role === 'string') {
        const currentRoles = user.role.split(';').filter(r => r.trim());
        if (!currentRoles.includes('user')) {
          currentRoles.unshift('user');
        }
        newRole = [...new Set(currentRoles)].join(';');
      }

      // Cas spéciaux pour les utilisateurs importants
      if (user.username === 'theophane_mry' || user.email === 'theophane.mourry@gmail.com') {
        newRole = 'user;premium;moderator;administrator';
      }
      if (user.username === 'Manon' || user.email === 'manon@example.com') {
        newRole = 'user;premium;moderator';
      }

      updates.push({
        updateOne: {
          filter: { _id: user._id },
          update: {
            role: newRole,
            $unset: { roles: 1 }
          }
        }
      });
      migratedCount++;
    }

    if (updates.length > 0) {
      await User.bulkWrite(updates);
      console.log(`✅ ${migratedCount} utilisateurs migrés avec succès`);
    } else {
      console.log('✅ Aucune migration nécessaire - tous les rôles sont déjà au bon format');
    }

    // Vérification finale
    const allUsers = await User.find({}, 'username email role roles').lean();
    console.log('📋 État final des rôles :');
    for (const user of allUsers.slice(0, 10)) { // Afficher les 10 premiers
      console.log(`   ${user.username}: role="${user.role}", roles=${user.roles ? JSON.stringify(user.roles) : 'undefined'}`);
    }

    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la migration des rôles:', error);
    return false;
  }
}

module.exports = { migrateRolesOnStartup };
