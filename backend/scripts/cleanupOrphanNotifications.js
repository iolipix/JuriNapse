#!/usr/bin/env node
/**
 * Nettoie les notifications orphelines.
 * Cas:
 *  - recipient inexistant ou isDeleted
 *  - sender inexistant ou isDeleted
 *  - (option) purge totale si plus aucun utilisateur actif
 * Usage CLI:
 *  --apply pour appliquer, sinon DRY RUN
 *  --force-all-if-no-users pour tout supprimer si aucun user actif
 */
const mongoose = require('mongoose');
require('dotenv').config({ path: process.env.ENV_PATH || '.env' });

const Notification = require('../models/notification.model');
const User = require('../models/user.model');

async function connect() {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URL;
  if (!uri) throw new Error('MONGODB connection string missing');
  await mongoose.connect(uri, { autoIndex: false });
}

async function cleanupOrphanNotifications({ dryRun = true, forceAllIfNoUsers = false, ignoreSystemAccounts = false } = {}) {
  const stats = {
    total: 0,
    totalUsers: 0,
    activeUsers: 0,
  systemUsers: 0,
    orphanRecipientMissing: 0,
    orphanRecipientDeleted: 0,
    orphanSenderMissing: 0,
    orphanSenderDeleted: 0,
    deleted: 0,
    forceAllPurge: false
  };

  console.log('🧹 Démarrage nettoyage notifications orphelines', dryRun ? '(DRY RUN)' : '');

  stats.total = await Notification.estimatedDocumentCount();
  const users = await User.find({}, '_id isDeleted').lean();
  stats.totalUsers = users.length;
  stats.systemUsers = users.filter(u => u.isSystemAccount).length;
  stats.activeUsers = users.filter(u => !u.isDeleted && (!ignoreSystemAccounts || !u.isSystemAccount)).length;

  const allUserIds = new Set(users.map(u => u._id.toString()));
  const activeUserIds = new Set(users.filter(u => !u.isDeleted && (!ignoreSystemAccounts || !u.isSystemAccount)).map(u => u._id.toString()));

  if (forceAllIfNoUsers && stats.activeUsers === 0) {
    stats.forceAllPurge = true;
    if (!dryRun) {
      const res = await Notification.deleteMany({});
      stats.deleted = res.deletedCount || 0;
    } else {
      stats.deleted = stats.total;
    }
    console.log('⚠️  Aucun utilisateur actif -> purge complète des notifications', dryRun ? '(simulation)' : '');
    return stats;
  }

  const cursor = Notification.find({}, '_id recipient sender').cursor();
  const toDelete = [];
  for await (const notif of cursor) {
    let orphan = false;
    let reasons = [];
    if (!notif.recipient || !allUserIds.has(notif.recipient.toString())) {
      orphan = true; reasons.push('recipient inexistant'); stats.orphanRecipientMissing++; }
    else if (!activeUserIds.has(notif.recipient.toString())) { orphan = true; reasons.push('recipient supprimé'); stats.orphanRecipientDeleted++; }
    if (!notif.sender || !allUserIds.has(notif.sender.toString())) { orphan = true; reasons.push('sender inexistant'); stats.orphanSenderMissing++; }
    else if (!activeUserIds.has(notif.sender.toString())) { orphan = true; reasons.push('sender supprimé'); stats.orphanSenderDeleted++; }
    if (orphan) {
      toDelete.push(notif._id);
      if (toDelete.length <= 5) console.log(`➡️  Notification orpheline ${notif._id} (${reasons.join(', ')})`);
    }
  }
  if (toDelete.length > 5) console.log(`… +${toDelete.length - 5} autres notifications orphelines`);

  if (!dryRun && toDelete.length) {
    const res = await Notification.deleteMany({ _id: { $in: toDelete } });
    stats.deleted = res.deletedCount || 0;
  } else {
    stats.deleted = toDelete.length;
  }

  console.log('\n📊 Résumé notifications orphelines:');
  console.log('  Total:                  ', stats.total);
  console.log('  Utilisateurs (actifs/t):', stats.activeUsers, '/', stats.totalUsers, ignoreSystemAccounts ? `(system ignorés: ${stats.systemUsers})` : '');
  console.log('  Recipient inexistant:   ', stats.orphanRecipientMissing);
  console.log('  Recipient supprimé:     ', stats.orphanRecipientDeleted);
  console.log('  Sender inexistant:      ', stats.orphanSenderMissing);
  console.log('  Sender supprimé:        ', stats.orphanSenderDeleted);
  console.log('  Supprimées:             ', stats.deleted, dryRun ? '(simulation)' : '');
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
  const stats = await cleanupOrphanNotifications({ dryRun, forceAllIfNoUsers, ignoreSystemAccounts });
      if (dryRun) console.log('\nUtilisez --apply pour appliquer réellement les suppressions');
      await mongoose.disconnect();
      process.exit(0);
    } catch (err) {
      console.error('❌ Erreur nettoyage notifications orphelines:', err);
      process.exit(1);
    }
  })();
}

module.exports = { cleanupOrphanNotifications };
