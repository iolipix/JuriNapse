const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom du dossier est requis'],
    trim: true,
    maxlength: [100, 'Le nom du dossier ne peut pas dépasser 100 caractères']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'La description ne peut pas dépasser 500 caractères']
  },
  color: {
    type: String,
    default: '#3B82F6',
    validate: {
      validator: function(v) {
        return /^#[0-9A-F]{6}$/i.test(v);
      },
      message: 'La couleur doit être un code hexadécimal valide'
    }
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['viewer', 'editor', 'admin'],
      default: 'viewer'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  postsCount: {
    type: Number,
    default: 0
  },
  subFoldersCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index pour optimiser les requêtes
folderSchema.index({ owner: 1, parentId: 1 });
folderSchema.index({ name: 'text', description: 'text' });

// Middleware pour mettre à jour le compteur de sous-dossiers
folderSchema.pre('save', async function(next) {
  if (this.isNew && this.parentId) {
    await mongoose.model('Folder').findByIdAndUpdate(
      this.parentId,
      { $inc: { subFoldersCount: 1 } }
    );
  }
  next();
});

// Middleware pour nettoyer les compteurs lors de la suppression
folderSchema.pre('findOneAndDelete', async function(next) {
  const folder = await this.model.findOne(this.getQuery());
  if (folder && folder.parentId) {
    await mongoose.model('Folder').findByIdAndUpdate(
      folder.parentId,
      { $inc: { subFoldersCount: -1 } }
    );
  }
  next();
});

// Méthode pour vérifier si un utilisateur peut accéder au dossier
folderSchema.methods.canAccess = function(userId) {
  if (this.owner.toString() === userId.toString()) {
    return true;
  }
  if (this.isPublic) {
    return true;
  }
  return this.collaborators.some(collab => 
    collab.user.toString() === userId.toString()
  );
};

// Méthode pour vérifier si un utilisateur peut modifier le dossier
folderSchema.methods.canEdit = function(userId) {
  if (this.owner.toString() === userId.toString()) {
    return true;
  }
  return this.collaborators.some(collab => 
    collab.user.toString() === userId.toString() && 
    (collab.role === 'editor' || collab.role === 'admin')
  );
};

// Méthode pour obtenir le chemin complet du dossier
folderSchema.methods.getPath = async function() {
  const path = [this.name];
  let current = this;
  
  while (current.parentId) {
    current = await mongoose.model('Folder').findById(current.parentId);
    if (current) {
      path.unshift(current.name);
    }
  }
  
  return path.join(' / ');
};

module.exports = mongoose.model('Folder', folderSchema);
