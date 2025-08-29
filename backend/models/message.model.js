const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // Permettre les messages système sans auteur
    required: function() {
      return !this.isSystemMessage;
    }
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  // Post partagé
  sharedPost: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    },
    title: String,
    content: String,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  // Dossier partagé
  sharedFolder: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder'
    },
    name: String,
    description: String,
    itemsCount: Number,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    color: String
  },
  // PDF partagé
  sharedPdf: {
    id: String,
    name: String,
    url: String,
    size: Number,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  // Champs pour la suppression douce
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  // Qui a supprimé le message (si ce n'est pas l'auteur)
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Raison de la suppression
  deletionReason: {
    type: String,
    default: null
  },
  // Message système (promotion, exclusion, etc.)
  isSystemMessage: {
    type: Boolean,
    default: false
  },
  // Système de réponse
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  }
}, {
  timestamps: true
});

// Index pour optimiser les recherches
messageSchema.index({ groupId: 1, createdAt: -1 });
messageSchema.index({ authorId: 1 });
messageSchema.index({ createdAt: -1 });
messageSchema.index({ replyTo: 1 });

module.exports = mongoose.model('Message', messageSchema);
