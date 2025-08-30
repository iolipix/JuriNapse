#!/usr/bin/env node
/**
 * Migration: centraliser les photos dans la collection ProfilePicture.
 * - Pour chaque user sans doc ProfilePicture mais avec user.profilePicture => créer doc.
 * - Option --clear-embedded pour vider le champ après migration (sinon on le laisse en cache).
 */
const mongoose = require('mongoose');
require('dotenv').config({ path: process.env.ENV_PATH || '.env' });
const User = require('../models/user.model');
const ProfilePicture = require('../models/profilePicture.model');

(async () => {
  const clearEmbedded = process.argv.includes('--clear-embedded');
  try {
    const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URL;
    if (!uri) throw new Error('Missing Mongo URI');
    await mongoose.connect(uri, { autoIndex: false });
    console.log('🔄 Migration profile pictures -> collection');

    const users = await User.find({}).select('profilePicture username').lean();
    const existing = await ProfilePicture.find({}).select('userId').lean();
    const existingSet = new Set(existing.map(p => p.userId.toString()));

    let created = 0, cleared = 0;
    for (const u of users) {
      if (u.profilePicture && u.profilePicture.length > 20 && !existingSet.has(u._id.toString())) {
        try {
          await ProfilePicture.create({
            userId: u._id,
            imageData: u.profilePicture,
            originalName: 'migrated',
            mimeType: u.profilePicture.startsWith('data:image/') ? u.profilePicture.substring(5, u.profilePicture.indexOf(';')) : 'image/png',
            size: Buffer.byteLength(u.profilePicture)
          });
          created++;
          if (clearEmbedded) {
            await User.updateOne({ _id: u._id }, { $set: { profilePicture: '' } });
            cleared++;
          }
        } catch (e) {
          console.warn('⚠️  Fail create for user', u.username, e.message);
        }
      }
    }
    console.log(`✅ Migration terminée. Créés: ${created}. Embeddeds vidés: ${cleared}.`);
    if (!clearEmbedded) console.log('ℹ️  Utiliser --clear-embedded pour vider les champs après validation.');
    await mongoose.disconnect();
  } catch (e) {
    console.error('❌ Erreur migration:', e);
    process.exit(1);
  }
})();
