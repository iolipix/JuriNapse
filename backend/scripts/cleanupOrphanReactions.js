#!/usr/bin/env node
/**
 * Nettoie les réactions orphelines.
 * Cas:
 *  - messageId inexistant
 *  - userId inexistant ou isDeleted
 *  - groupId inexistant
 *  - (option) purge totale si plus aucun utilisateur actif
 */
const mongoose = require('mongoose');
require('dotenv').config({ path: process.env.ENV_PATH || '.env' });
const Reaction = require('../models/reaction.model');
const Message = require('../models/message.model');
const User = require('../models/user.model');
const Group = require('../models/group.model');

async function connect() {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URL;
  if (!uri) throw new Error('MONGODB connection string missing');
  await mongoose.connect(uri, { autoIndex: false });
}

async function cleanupOrphanReactions({ dryRun = true, forceAllIfNoUsers = false, ignoreSystemAccounts = false } = {}) {
  const stats = {
    total: 0,
    totalUsers: 0,
    activeUsers: 0,
  systemUsers: 0,
    totalMessages: 0,
    totalGroups: 0,
    orphanMessageMissing: 0,
    orphanUserMissing: 0,
    orphanUserDeleted: 0,
    orphanGroupMissing: 0,
    deleted: 0,
    forceAllPurge: false
  };
  console.log('🧹 Démarrage nettoyage réactions orphelines', dryRun ? '(DRY RUN)' : '');
  stats.total = await Reaction.estimatedDocumentCount();
  const users = await User.find({}, '_id isDeleted').lean();
  const messages = await Message.find({}, '_id').lean();
  const groups = await Group.find({}, '_id').lean();
  stats.totalUsers = users.length;
  stats.systemUsers = users.filter(u => u.isSystemAccount).length;
  stats.activeUsers = users.filter(u => !u.isDeleted && (!ignoreSystemAccounts || !u.isSystemAccount)).length;
  stats.totalMessages = messages.length;
  stats.totalGroups = groups.length;
  const userIds = new Set(users.map(u => u._id.toString()));
  const activeUserIds = new Set(users.filter(u => !u.isDeleted && (!ignoreSystemAccounts || !u.isSystemAccount)).map(u => u._id.toString()));
  const messageIds = new Set(messages.map(m => m._id.toString()));
  const groupIds = new Set(groups.map(g => g._id.toString()));

  if (forceAllIfNoUsers && stats.activeUsers === 0) {
    stats.forceAllPurge = true;
    if (!dryRun) {
      const res = await Reaction.deleteMany({});
      stats.deleted = res.deletedCount || 0;
    } else {
      stats.deleted = stats.total;
    }
    console.log('⚠️  Aucun utilisateur actif -> purge complète des réactions', dryRun ? '(simulation)' : '');
    return stats;
  }

  const cursor = Reaction.find({}, '_id messageId userId groupId').cursor();
  const toDelete = [];
  for await (const r of cursor) {
    let orphan = false; const reasons = [];
    if (!r.messageId || !messageIds.has(r.messageId.toString())) { orphan = true; stats.orphanMessageMissing++; reasons.push('message inexistant'); }
    if (!r.groupId || !groupIds.has(r.groupId.toString())) { orphan = true; stats.orphanGroupMissing++; reasons.push('groupe inexistant'); }
    if (!r.userId || !userIds.has(r.userId.toString())) { orphan = true; stats.orphanUserMissing++; reasons.push('user inexistant'); }
    else if (!activeUserIds.has(r.userId.toString())) { orphan = true; stats.orphanUserDeleted++; reasons.push('user supprimé'); }
    if (orphan) {
      toDelete.push(r._id);
      if (toDelete.length <= 5) console.log(`➡️  Réaction orpheline ${r._id} (${reasons.join(', ')})`);
    }
  }
  if (toDelete.length > 5) console.log(`… +${toDelete.length - 5} autres réactions orphelines`);
  if (!dryRun && toDelete.length) {
    const res = await Reaction.deleteMany({ _id: { $in: toDelete } });
    stats.deleted = res.deletedCount || 0;
  } else {
    stats.deleted = toDelete.length;
  }
  console.log('\n📊 Résumé réactions orphelines:');
  console.log('  Total:                ', stats.total);
  console.log('  Messages:             ', stats.totalMessages);
  console.log('  Groupes:              ', stats.totalGroups);
  console.log('  Utilisateurs actifs:  ', stats.activeUsers, '/', stats.totalUsers, ignoreSystemAccounts ? `(system ignorés: ${stats.systemUsers})` : '');
  console.log('  Message inexistant:   ', stats.orphanMessageMissing);
  console.log('  Groupe inexistant:    ', stats.orphanGroupMissing);
  console.log('  User inexistant:      ', stats.orphanUserMissing);
  console.log('  User supprimé:        ', stats.orphanUserDeleted);
  console.log('  Supprimées:           ', stats.deleted, dryRun ? '(simulation)' : '');
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
  await cleanupOrphanReactions({ dryRun, forceAllIfNoUsers, ignoreSystemAccounts });
      if (dryRun) console.log('\nUtilisez --apply pour appliquer réellement les suppressions');
      await mongoose.disconnect();
      process.exit(0);
    } catch (err) {
      console.error('❌ Erreur nettoyage réactions orphelines:', err);
      process.exit(1);
    }
  })();
}

module.exports = { cleanupOrphanReactions };
