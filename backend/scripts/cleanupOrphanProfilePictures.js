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
const ProfilePicture = require('../models/profilePicture.model');
const User = require('../models/user.model');

async function connect() {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URL;
  if (!uri) throw new Error('MONGODB connection string missing');
  await mongoose.connect(uri, { autoIndex: false });
}

async function cleanupOrphanProfilePictures({ dryRun = true, forceAllIfNoUsers = false } = {}) {
  const stats = {
    total: 0,
    totalUsers: 0,
    activeUsers: 0,
    orphanUserMissing: 0,
    orphanUserDeleted: 0,
    deleted: 0,
    forceAllPurge: false
  };
  console.log('🧹 Démarrage nettoyage photos de profil orphelines', dryRun ? '(DRY RUN)' : '');
  stats.total = await ProfilePicture.estimatedDocumentCount();
  const users = await User.find({}, '_id isDeleted').lean();
  stats.totalUsers = users.length;
  stats.activeUsers = users.filter(u => !u.isDeleted).length;
  const userIds = new Set(users.map(u => u._id.toString()));
  const activeUserIds = new Set(users.filter(u => !u.isDeleted).map(u => u._id.toString()));

  if (forceAllIfNoUsers && stats.activeUsers === 0) {
    stats.forceAllPurge = true;
    if (!dryRun) {
      const res = await ProfilePicture.deleteMany({});
      stats.deleted = res.deletedCount || 0;
    } else {
      stats.deleted = stats.total;
    }
    console.log('⚠️  Aucun utilisateur actif -> purge complète des photos de profil', dryRun ? '(simulation)' : '');
    return stats;
  }

  const cursor = ProfilePicture.find({}, '_id userId').cursor();
  const toDelete = [];
  for await (const p of cursor) {
    let orphan = false; const reasons = [];
    if (!p.userId || !userIds.has(p.userId.toString())) { orphan = true; stats.orphanUserMissing++; reasons.push('user inexistant'); }
    else if (!activeUserIds.has(p.userId.toString())) { orphan = true; stats.orphanUserDeleted++; reasons.push('user supprimé'); }
    if (orphan) {
      toDelete.push(p._id);
      if (toDelete.length <= 5) console.log(`➡️  Photo de profil orpheline ${p._id} (${reasons.join(', ')})`);
    }
  }
  if (toDelete.length > 5) console.log(`… +${toDelete.length - 5} autres photos orphelines`);
  if (!dryRun && toDelete.length) {
    const res = await ProfilePicture.deleteMany({ _id: { $in: toDelete } });
    stats.deleted = res.deletedCount || 0;
  } else {
    stats.deleted = toDelete.length;
  }
  console.log('\n📊 Résumé photos orphelines:');
  console.log('  Total:               ', stats.total);
  console.log('  Utilisateurs actifs: ', stats.activeUsers, '/', stats.totalUsers);
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
      await connect();
      await cleanupOrphanProfilePictures({ dryRun, forceAllIfNoUsers });
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
