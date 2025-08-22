const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'like',
      'comment',
      'follow',
      'post_shared',
      'folder_shared',
      'collaborator_added',
      'mention',
      'system'
    ]
  },
  message: {
    type: String,
    required: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  relatedPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    default: null
  },
  relatedFolder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  },
  relatedComment: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index pour optimiser les requêtes
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, type: 1 });

// Middleware pour marquer automatiquement la date de lecture
notificationSchema.pre('save', function(next) {
  if (this.isModified('isRead') && this.isRead && !this.readAt) {
    this.readAt = new Date();
  }
  next();
});

// Méthode pour marquer comme lu
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Méthode statique pour créer une notification
notificationSchema.statics.createNotification = async function(data) {
  const { recipient, sender, type, message, relatedPost, relatedFolder, relatedComment, metadata } = data;
  
  // Éviter les auto-notifications
  if (recipient.toString() === sender.toString()) {
    return null;
  }
  
  const notification = new this({
    recipient,
    sender,
    type,
    message,
    relatedPost,
    relatedFolder,
    relatedComment,
    metadata
  });
  
  return await notification.save();
};

// Méthode statique pour obtenir les notifications non lues
notificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({ recipient: userId, isRead: false });
};

module.exports = mongoose.model('Notification', notificationSchema);
