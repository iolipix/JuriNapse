const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  moderatorIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isPrivate: {
    type: Boolean,
    default: false
  },
  hiddenFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Track quand chaque utilisateur a masqué la conversation
  hiddenForWithTimestamp: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    hiddenAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Track quand chaque utilisateur a supprimé l'historique
  historyDeletedFor: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    deletedAt: {
      type: Date,
      default: Date.now
    }
  }],
  notificationsEnabled: {
    type: Map,
    of: Boolean,
    default: new Map()
  },
  profilePicture: {
    type: String,
    required: false,
    default: null
  }
}, {
  timestamps: true
});

// Index pour optimiser les recherches
groupSchema.index({ adminId: 1 });
groupSchema.index({ members: 1 });
groupSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Group', groupSchema);
