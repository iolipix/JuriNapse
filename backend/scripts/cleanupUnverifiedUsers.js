// Supprime les comptes non vérifiés créés il y a plus d'une heure
// A exécuter via cron / tâche planifiée (Railway scheduler ou autre)

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user.model');
const EmailVerification = require('../models/emailVerification.model');

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/jurinapse';
  await mongoose.connect(uri);
  const cutoff = new Date(Date.now() - 60 * 60 * 1000); // 1h
  const toDelete = await User.find({ emailVerified: false, createdAt: { $lt: cutoff } });
  if (!toDelete.length) {
    console.log('Aucun compte non vérifié à supprimer.');
    return process.exit(0);
  }
  const ids = toDelete.map(u => u._id);
  await EmailVerification.deleteMany({ userId: { $in: ids } });
  const res = await User.deleteMany({ _id: { $in: ids } });
  console.log(`Supprimé ${res.deletedCount} comptes non vérifiés (>1h).`);
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
