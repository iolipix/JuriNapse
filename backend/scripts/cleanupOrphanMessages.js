#!/usr/bin/env node
/**
 * Nettoie les messages orphelins.
 * Cas pris en charge:
 *  - authorId absent ou utilisateur inexistant
 *  - utilisateur auteur marqué isDeleted=true
 *  - groupId inexistant
 *  - (option) aucun utilisateur actif restant => purge complète
 *  - (option) messages système (isSystemMessage) si leur groupe est inexistant
 *
 * Options CLI:
 *  --apply                Appliquer réellement les suppressions (sinon DRY RUN)
 *  --include-system       Inclure les messages système si orphelins
 *  --force-all-if-no-users Si aucun utilisateur actif, tout supprimer (hors DRY RUN)
 */
const mongoose = require('mongoose');
require('dotenv').config({ path: process.env.ENV_PATH || '.env' });

const Message = require('../models/message.model');
const User = require('../models/user.model');
const Group = require('../models/group.model');
// Constante importée (si change ailleurs, on garde même valeur ici)
const { UTILISATEUR_INTROUVABLE_ID } = require('../middleware/orphanCleanup');

async function connect() {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URL;
  if (!uri) throw new Error('MONGODB connection string missing');
  await mongoose.connect(uri, { autoIndex: false });
}

async function cleanupOrphanMessages({
  dryRun = true,
  includeSystem = false,
  forceAllIfNoUsers = false
} = {}) {
  const stats = {
    totalMessages: 0,
    totalUsers: 0,
    activeUsers: 0,
    totalGroups: 0,
    orphanAuthorMissing: 0,
    orphanAuthorDeleted: 0,
    orphanGroupMissing: 0,
    orphanPlaceholderAuthor: 0,
    systemSkipped: 0,
    deleted: 0,
    forceAllPurge: false
  };

  console.log('🧹 Démarrage nettoyage messages orphelins', dryRun ? '(DRY RUN)' : '');

  stats.totalMessages = await Message.estimatedDocumentCount();
  const users = await User.find({}, '_id isDeleted').lean();
  const groups = await Group.find({}, '_id').lean();
  stats.totalUsers = users.length;
  stats.activeUsers = users.filter(u => !u.isDeleted).length;
  stats.totalGroups = groups.length;

  const activeUserIds = new Set(users.filter(u => !u.isDeleted).map(u => u._id.toString()));
  const allUserIds = new Set(users.map(u => u._id.toString()));
  const groupIds = new Set(groups.map(g => g._id.toString()));

  // Si pas d'utilisateur actif et option activée => purge totale
  if (forceAllIfNoUsers && stats.activeUsers === 0) {
    stats.forceAllPurge = true;
    if (!dryRun) {
      const res = await Message.deleteMany({});
      stats.deleted = res.deletedCount || 0;
    } else {
      stats.deleted = stats.totalMessages; // estimation
    }
    console.log('⚠️  Aucun utilisateur actif trouvé -> purge complète des messages', dryRun ? '(simulation)' : '');
    return stats;
  }

  // Parcours par curseur pour limiter la mémoire
  const cursor = Message.find({}, '_id authorId groupId isSystemMessage').cursor();
  const idsToDelete = [];

  for await (const msg of cursor) {
    let orphan = false;
    let reason = [];

    const isSystem = msg.isSystemMessage === true;

    // Groupe inexistant
    if (!msg.groupId || !groupIds.has(msg.groupId.toString())) {
      orphan = true;
      stats.orphanGroupMissing++;
      reason.push('groupe inexistant');
    }

    if (msg.authorId) {
      const aid = msg.authorId.toString();
      if (!allUserIds.has(aid)) {
        orphan = true;
        stats.orphanAuthorMissing++;
        reason.push('auteur inexistant');
      } else if (!activeUserIds.has(aid)) {
        // auteur supprimé (isDeleted)
        orphan = true;
        stats.orphanAuthorDeleted++;
        reason.push('auteur supprimé');
      } else if (aid === UTILISATEUR_INTROUVABLE_ID.toString()) {
        orphan = true; // on considère ces messages comme orphelins pour nettoyage final
        stats.orphanPlaceholderAuthor++;
        reason.push('auteur placeholder');
      }
    } else {
      // Pas d'auteur => messages système ou anomalies; on ne les supprime que si groupe inexistant ou includeSystem
      if (isSystem) {
        if (includeSystem || !msg.groupId || !groupIds.has(msg.groupId.toString())) {
          orphan = true;
          reason.push('system + groupe inexistant');
        } else {
          stats.systemSkipped++;
        }
      } else {
        // Message sans auteur non système => anomalie
        orphan = true;
        reason.push('auteur absent');
      }
    }

    if (orphan) {
      idsToDelete.push(msg._id);
      if (idsToDelete.length <= 5) {
        console.log(`➡️  Message orphelin ${msg._id} (${reason.join(', ')})`);
      }
    }
  }

  if (idsToDelete.length > 5) {
    console.log(`… +${idsToDelete.length - 5} autres messages orphelins`);
  }

  if (!dryRun && idsToDelete.length) {
    const res = await Message.deleteMany({ _id: { $in: idsToDelete } });
    stats.deleted = res.deletedCount || 0;
  } else {
    stats.deleted = idsToDelete.length; // estimation
  }

  console.log('\n📊 Résumé messages orphelins:');
  console.log('  Messages totaux:            ', stats.totalMessages);
  console.log('  Utilisateurs (actifs/total):', stats.activeUsers, '/', stats.totalUsers);
  console.log('  Groupes:                    ', stats.totalGroups);
  console.log('  Auteur inexistant:          ', stats.orphanAuthorMissing);
  console.log('  Auteur supprimé:            ', stats.orphanAuthorDeleted);
  console.log('  Auteur placeholder:         ', stats.orphanPlaceholderAuthor);
  console.log('  Groupe inexistant:          ', stats.orphanGroupMissing);
  console.log('  Messages système ignorés:   ', stats.systemSkipped);
  console.log('  Supprimés:                  ', stats.deleted, dryRun ? '(simulation)' : '');
  if (stats.forceAllPurge) console.log('  Mode purge totale activé');

  return stats;
}

if (require.main === module) {
  (async () => {
    try {
      const dryRun = !process.argv.includes('--apply');
      const includeSystem = process.argv.includes('--include-system');
      const forceAllIfNoUsers = process.argv.includes('--force-all-if-no-users');
      await connect();
      const stats = await cleanupOrphanMessages({ dryRun, includeSystem, forceAllIfNoUsers });
      if (dryRun) console.log('\nUtilisez --apply pour appliquer réellement les suppressions');
      await mongoose.disconnect();
      process.exit(0);
    } catch (err) {
      console.error('❌ Erreur nettoyage messages orphelins:', err);
      process.exit(1);
    }
  })();
}

module.exports = { cleanupOrphanMessages };
