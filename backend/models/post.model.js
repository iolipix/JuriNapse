const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  likes: {
    type: Number,
    default: 0
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

const postSchema = new mongoose.Schema({
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['fiche-arret', 'conseil', 'question', 'discussion', 'cours', 'protocole']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  slug: {
    type: String,
    sparse: true, // Permet d'avoir des valeurs null
    maxlength: [100, 'Slug cannot exceed 100 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    maxlength: [10000, 'Content cannot exceed 10000 characters']
  },
  tags: [{
    type: String,
    lowercase: true,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  likes: {
    type: Number,
    default: 0
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  savesCount: {
    type: Number,
    default: 0
  },
  savesWithTimestamp: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    savedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [commentSchema],
  isPrivate: {
    type: Boolean,
    default: false
  },
  decisionNumber: {
    type: String,
    default: null
  },
  jurisdiction: {
    type: String,
    default: null,
    maxlength: [200, 'Jurisdiction cannot exceed 200 characters']
  },
  folderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  },
  pdfFile: {
    name: String,
    url: String,
    size: Number
  },
  lastUserEdit: {
    type: Date,
    default: null // Sera défini uniquement lors de modifications utilisateur
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Index pour optimiser les recherches
postSchema.index({ authorId: 1 });
postSchema.index({ type: 1 });
postSchema.index({ tags: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ likes: -1 });
postSchema.index({ savesCount: -1 }); // Index pour le compteur de sauvegardes
postSchema.index({ decisionNumber: 1 });
postSchema.index({ folderId: 1 });
postSchema.index({ isPrivate: 1 });

// Index de recherche textuelle
postSchema.index({ 
  title: 'text', 
  content: 'text', 
  tags: 'text' 
});

// Middleware pour mettre à jour le compteur de likes
postSchema.pre('save', function(next) {
  if (this.isModified('likedBy')) {
    this.likes = this.likedBy.length;
  }
  
  // Mettre à jour les likes des commentaires
  if (this.isModified('comments')) {
    this.comments.forEach(comment => {
      comment.likes = comment.likedBy.length;
    });
  }
  
  next();
});

module.exports = mongoose.model('Post', postSchema);
