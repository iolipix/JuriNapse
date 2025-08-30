#!/usr/bin/env node
/**
 * Nettoie les documents de photos de profil orphelins.
 * Cas:
 *  - userId inexistant
 *  - userId isDeleted
 *  - (option) purge totale si plus aucun utilisateur actif
 */
const mongoose = require('mongoose');
require('dotenv').config({ path: process.env.ENV_PATH || '.env' });
// Deprecated: ProfilePicture model removed.
// const ProfilePicture = require('../models/profilePicture.model');
const User = require('../models/user.model');

async function connect() {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URL;
  if (!uri) throw new Error('MONGODB connection string missing');
  await mongoose.connect(uri, { autoIndex: false });
}

async function cleanupOrphanProfilePictures({ dryRun = true, forceAllIfNoUsers = false, ignoreSystemAccounts = false } = {}) {
  const stats = {
    total: 0,
    totalUsers: 0,
    activeUsers: 0,
  systemUsers: 0,
    orphanUserMissing: 0,
    orphanUserDeleted: 0,
    deleted: 0,
    forceAllPurge: false
  };
  console.log('🧹 Démarrage nettoyage photos de profil orphelines', dryRun ? '(DRY RUN)' : '');
  stats.total = 0; // Model removed
  const users = await User.find({}, '_id isDeleted').lean();
  stats.totalUsers = users.length;
  stats.systemUsers = users.filter(u => u.isSystemAccount).length;
  stats.activeUsers = users.filter(u => !u.isDeleted && (!ignoreSystemAccounts || !u.isSystemAccount)).length;
  const userIds = new Set(users.map(u => u._id.toString()));
  const activeUserIds = new Set(users.filter(u => !u.isDeleted && (!ignoreSystemAccounts || !u.isSystemAccount)).map(u => u._id.toString()));

  // Force purge logic disabled since collection removed.

  // No cursor iteration; collection removed.
  const toDelete = [];
  stats.deleted = 0;
  console.log('\n📊 Résumé photos orphelines:');
  console.log('  Total:               ', stats.total);
  console.log('  Utilisateurs actifs: ', stats.activeUsers, '/', stats.totalUsers, ignoreSystemAccounts ? `(system ignorés: ${stats.systemUsers})` : '');
  console.log('  User inexistant:     ', stats.orphanUserMissing);
  console.log('  User supprimé:       ', stats.orphanUserDeleted);
  console.log('  Supprimées:          ', stats.deleted, dryRun ? '(simulation)' : '');
  if (stats.forceAllPurge) console.log('  Mode purge totale activé');
  return stats;
}

if (require.main === module) {
  (async () => {
    try {
      const dryRun = !process.argv.includes('--apply');
  const forceAllIfNoUsers = process.argv.includes('--force-all-if-no-users');
  const ignoreSystemAccounts = process.argv.includes('--ignore-system-accounts');
      await connect();
  await cleanupOrphanProfilePictures({ dryRun, forceAllIfNoUsers, ignoreSystemAccounts });
      if (dryRun) console.log('\nUtilisez --apply pour appliquer réellement les suppressions');
      await mongoose.disconnect();
      process.exit(0);
    } catch (err) {
      console.error('❌ Erreur nettoyage photos orphelines:', err);
      process.exit(1);
    }
  })();
}

module.exports = { cleanupOrphanProfilePictures };
