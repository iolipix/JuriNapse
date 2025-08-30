#!/usr/bin/env node
/**
 * Orchestrateur de nettoyage global:
 *  - Groupes vides
 *  - Messages orphelins
 *  - Notifications orphelines
 *  - Réactions orphelines
 *  - Photos de profil orphelines
 * Options:
 *  --apply (sinon DRY RUN)
 *  --include-system (messages système)
 *  --force-all-if-no-users (purge totale si plus d'utilisateurs actifs)
 */
const mongoose = require('mongoose');
require('dotenv').config({ path: process.env.ENV_PATH || '.env' });

const { cleanupEmptyGroups } = require('./cleanupEmptyGroups');
const { cleanupOrphanMessages } = require('./cleanupOrphanMessages');
const { cleanupOrphanNotifications } = require('./cleanupOrphanNotifications');
const { cleanupOrphanReactions } = require('./cleanupOrphanReactions');
const { cleanupOrphanProfilePictures } = require('./cleanupOrphanProfilePictures');

async function connectIfNeeded() {
  if (mongoose.connection.readyState === 1) return; // already connected
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URL;
  if (!uri) throw new Error('MONGODB connection string missing');
  await mongoose.connect(uri, { autoIndex: false });
}

async function maintenanceCleanupAll({
  dryRun = true,
  includeSystem = true,
  forceAllIfNoUsers = true
} = {}) {
  const started = Date.now();
  console.log('🧹 Lancement maintenanceCleanupAll', dryRun ? '(DRY RUN)' : '');
  const results = {};
  try {
    results.groups = await cleanupEmptyGroups({ dryRun });
  } catch (e) { results.groups = { error: e.message }; console.error('❌ groups:', e.message); }
  try {
    results.messages = await cleanupOrphanMessages({ dryRun, includeSystem, forceAllIfNoUsers });
  } catch (e) { results.messages = { error: e.message }; console.error('❌ messages:', e.message); }
  try {
    results.notifications = await cleanupOrphanNotifications({ dryRun, forceAllIfNoUsers });
  } catch (e) { results.notifications = { error: e.message }; console.error('❌ notifications:', e.message); }
  try {
    results.reactions = await cleanupOrphanReactions({ dryRun, forceAllIfNoUsers });
  } catch (e) { results.reactions = { error: e.message }; console.error('❌ reactions:', e.message); }
  try {
    results.profilePictures = await cleanupOrphanProfilePictures({ dryRun, forceAllIfNoUsers });
  } catch (e) { results.profilePictures = { error: e.message }; console.error('❌ profilePictures:', e.message); }
  results.durationMs = Date.now() - started;
  console.log('✅ maintenanceCleanupAll terminé en', results.durationMs + 'ms');
  return results;
}

if (require.main === module) {
  (async () => {
    try {
      const dryRun = !process.argv.includes('--apply');
      const includeSystem = process.argv.includes('--include-system');
      const forceAllIfNoUsers = process.argv.includes('--force-all-if-no-users');
      await connectIfNeeded();
      const res = await maintenanceCleanupAll({ dryRun, includeSystem, forceAllIfNoUsers });
      if (dryRun) console.log('\nUtilisez --apply pour appliquer réellement les suppressions');
      console.log(JSON.stringify(res, null, 2));
      await mongoose.disconnect();
      process.exit(0);
    } catch (err) {
      console.error('❌ Erreur maintenanceCleanupAll:', err);
      process.exit(1);
    }
  })();
}

module.exports = { maintenanceCleanupAll };
