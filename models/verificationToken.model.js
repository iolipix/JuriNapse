const mongoose = require('mongoose');

const verificationTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  tokenType: {
    type: String,
    enum: ['email_verification', 'password_reset'],
    default: 'email_verification',
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // MongoDB supprime automatiquement les documents expirés
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600 // 1 heure en secondes - fallback au cas où expiresAt ne fonctionne pas
  }
});

// Index composé pour des requêtes efficaces
verificationTokenSchema.index({ token: 1, tokenType: 1 });
verificationTokenSchema.index({ userId: 1, tokenType: 1 });

// Méthode pour vérifier si le token est expiré
verificationTokenSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

// Méthode statique pour nettoyer les tokens expirés (au cas où)
verificationTokenSchema.statics.cleanupExpired = function() {
  return this.deleteMany({ expiresAt: { $lt: new Date() } });
};

const VerificationToken = mongoose.model('VerificationToken', verificationTokenSchema);

module.exports = VerificationToken;
