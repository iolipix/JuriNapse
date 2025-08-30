#!/usr/bin/env node
/**
 * Supprime les groupes sans membres valides et leurs messages associés.
 * Conditions de suppression:
 *  - Tableau members vide OU undefined
 *  - Tous les members référencent des utilisateurs inexistants / supprimés (isDeleted=true)
 * Sécurité: Skip si groupe contient encore l'admin actif (adminId non supprimé)
 */
const mongoose = require('mongoose');
require('dotenv').config({ path: process.env.ENV_PATH || '.env' });

const Group = require('../models/group.model');
const User = require('../models/user.model');
const Message = require('../models/message.model');

async function connect() {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URL;
  if (!uri) throw new Error('MONGODB connection string missing');
  await mongoose.connect(uri, { autoIndex: false });
}

async function groupHasValidMembers(group) {
  if (!group.members || group.members.length === 0) return false;
  // Charger uniquement les flags nécessaires
  const users = await User.find({ _id: { $in: group.members } }).select('_id isDeleted');
  if (users.length === 0) return false;
  return users.some(u => !u.isDeleted); // au moins un membre actif
}

async function adminIsActive(group) {
  if (!group.adminId) return false;
  const admin = await User.findById(group.adminId).select('_id isDeleted');
  return !!admin && !admin.isDeleted;
}

async function cleanupEmptyGroups({ dryRun = true } = {}) {
  const stats = { total: 0, candidates: 0, deletedGroups: 0, deletedMessages: 0, skippedAdminActive: 0 };
  console.log('🧹 Démarrage nettoyage groupes vides', dryRun ? '(DRY RUN)' : '');

  const cursor = Group.find({}).cursor();
  for await (const group of cursor) {
    stats.total++;

    let deleteReason = null;

    // Condition 1: members absent ou vide
    if (!group.members || group.members.length === 0) {
      deleteReason = 'Aucun membre';
    } else {
      // Condition 2: tous les membres supprimés/inexistants
      const hasValid = await groupHasValidMembers(group);
      if (!hasValid) deleteReason = 'Tous les membres supprimés';
    }

    if (deleteReason) {
      // Vérifier admin actif: si adminId actif mais plus de members listés => on conserve (anomalie à réparer manuellement)
      const adminActive = await adminIsActive(group);
      if (adminActive && (group.members && group.members.length === 0)) {
        stats.skippedAdminActive++;
        continue;
      }

      stats.candidates++;
      console.log(`➡️  Groupe candidat (${group._id}) "${group.name}" - ${deleteReason}`);

      if (!dryRun) {
        // Supprimer messages
        const resMsg = await Message.deleteMany({ groupId: group._id });
        stats.deletedMessages += resMsg.deletedCount || 0;
        // Supprimer groupe
        await Group.deleteOne({ _id: group._id });
        stats.deletedGroups++;
      }
    }
  }

  console.log('\n📊 Résumé nettoyage:');
  console.log('  Groupes scannés:       ', stats.total);
  console.log('  Candidats:             ', stats.candidates);
  console.log('  Groupes supprimés:     ', stats.deletedGroups);
  console.log('  Messages supprimés:    ', stats.deletedMessages);
  console.log('  Ignorés admin actif:   ', stats.skippedAdminActive);
  return stats;
}

if (require.main === module) {
  (async () => {
    try {
      const dryRun = process.argv.includes('--apply') ? false : true;
      await connect();
      const stats = await cleanupEmptyGroups({ dryRun });
      if (dryRun) console.log('\nUtilisez --apply pour appliquer réellement les suppressions');
      await mongoose.disconnect();
      process.exit(0);
    } catch (err) {
      console.error('❌ Erreur nettoyage groupes:', err);
      process.exit(1);
    }
  })();
}

module.exports = { cleanupEmptyGroups };
