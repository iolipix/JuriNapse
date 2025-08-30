#!/usr/bin/env node
/**
 * Migration inverse: recopier les photos depuis la collection ProfilePicture
 * vers user.profilePicture si ce champ est vide. Option --purge-collection
 * pour supprimer les documents après migration (après validation).
 */
const mongoose = require('mongoose');
require('dotenv').config({ path: process.env.ENV_PATH || '.env' });
const User = require('../models/user.model');
// Ancien modèle ProfilePicture supprimé; variable conservée uniquement pour éviter les erreurs de référence dans le code commenté.
// let ProfilePicture; // deprecated

(async () => {
  const purge = process.argv.includes('--purge-collection');
  try {
    const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URL;
    if (!uri) throw new Error('Missing Mongo URI');
    await mongoose.connect(uri, { autoIndex: false });
    console.log('🔄 Migration profile pictures -> embedded (User.profilePicture)');

  // Disabled: collection plus présente.
  // const cursor = ProfilePicture.find({}).select('userId imageData').cursor();
  // let updated = 0, skipped = 0;
  // for await (const doc of cursor) {
  //   const user = await User.findById(doc.userId).select('profilePicture');
  //   if (!user) continue;
  //   if (user.profilePicture && user.profilePicture.length > 20) {
  //     skipped++; // déjà présent
  //     continue;
  //   }
  //   if (doc.imageData && doc.imageData.length > 20) {
  //     user.profilePicture = doc.imageData;
  //     try { await user.save(); updated++; } catch (e) { console.warn('⚠️  Save fail user', doc.userId.toString(), e.message); }
  //   }
  // }

    console.log(`✅ Migration terminée. Users mis à jour: ${updated}. Skipped (déjà ok): ${skipped}.`);
    if (purge) {
      const res = await ProfilePicture.deleteMany({});
      console.log(`🧹 Collection ProfilePicture purgée: ${res.deletedCount} docs supprimés.`);
    } else {
      console.log('ℹ️  Utiliser --purge-collection après validation pour supprimer la collection.');
    }
    await mongoose.disconnect();
  } catch (e) {
    console.error('❌ Erreur migration inverse:', e);
    process.exit(1);
  }
})();
