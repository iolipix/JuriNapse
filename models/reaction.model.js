const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema({
  messageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  emoji: {
    type: String,
    required: true,
    maxlength: 10
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// Index composé pour optimiser les requêtes
reactionSchema.index({ messageId: 1, emoji: 1 });
reactionSchema.index({ messageId: 1, userId: 1 });
reactionSchema.index({ userId: 1, emoji: 1 });

// Contrainte d'unicité : un utilisateur ne peut avoir qu'une seule réaction par message
reactionSchema.index({ messageId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Reaction', reactionSchema);
