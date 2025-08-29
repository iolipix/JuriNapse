const mongoose = require('mongoose');

const profilePictureSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  imageData: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// L'index sur userId est déjà créé par unique: true, pas besoin de le redéfinir
// profilePictureSchema.index({ userId: 1 });

module.exports = mongoose.model('ProfilePicture', profilePictureSchema);
