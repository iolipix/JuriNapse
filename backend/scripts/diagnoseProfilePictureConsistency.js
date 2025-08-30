#!/usr/bin/env node
/**
 * Diagnostic de cohérence entre User.profilePicture et collection ProfilePicture.
 */
const mongoose = require('mongoose');
require('dotenv').config({ path: process.env.ENV_PATH || '.env' });
const User = require('../models/user.model');
const ProfilePicture = require('../models/profilePicture.model');

(async () => {
  try {
    const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URL;
    if (!uri) throw new Error('Missing Mongo URI');
    await mongoose.connect(uri, { autoIndex: false });

    const users = await User.find({}, 'profilePicture isDeleted username').lean();
    const profilePics = await ProfilePicture.find({}, 'userId').lean();
    const picSet = new Set(profilePics.map(p => p.userId.toString()));

    let onlyInUser = 0, onlyInCollection = 0, both = 0, empty = 0;
    const examples = { onlyInUser: [], onlyInCollection: [], both: [], empty: [] };

    for (const u of users) {
      const hasEmb = !!(u.profilePicture && u.profilePicture.length > 0);
      const hasColl = picSet.has(u._id.toString());
      if (hasEmb && hasColl) { both++; if (examples.both.length < 3) examples.both.push(u.username); }
      else if (hasEmb) { onlyInUser++; if (examples.onlyInUser.length < 3) examples.onlyInUser.push(u.username); }
      else if (hasColl) { onlyInCollection++; if (examples.onlyInCollection.length < 3) examples.onlyInCollection.push(u.username); }
      else { empty++; if (examples.empty.length < 3) examples.empty.push(u.username); }
    }

    console.log('\n📊 Cohérence photos de profil:');
    console.log('  Users total:', users.length);
    console.log('  Docs ProfilePicture:', profilePics.length);
    console.log('  Uniquement dans User.profilePicture:', onlyInUser, examples.onlyInUser);
    console.log('  Uniquement dans collection:', onlyInCollection, examples.onlyInCollection);
    console.log('  Présent dans les deux:', both, examples.both);
    console.log('  Aucun des deux:', empty, examples.empty);

    await mongoose.disconnect();
  } catch (e) {
    console.error('❌ Erreur diagnostic:', e);
    process.exit(1);
  }
})();
