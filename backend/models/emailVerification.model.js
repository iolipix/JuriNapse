const mongoose = require('mongoose');

const emailVerificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true
  },
  used: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index pour auto-suppression des documents expirés
emailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index unique pour éviter les doublons par utilisateur
emailVerificationSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model('EmailVerification', emailVerificationSchema);
