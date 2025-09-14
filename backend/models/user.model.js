const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  // Champs spécifiques à votre AuthForm
  university: {
    type: String,
    default: '',
    maxlength: [100, 'University name cannot exceed 100 characters']
  },
  graduationYear: {
    type: Number,
    min: [2000, 'Graduation year must be after 2000'],
    max: [2035, 'Graduation year must be before 2035'],
    default: new Date().getFullYear()
  },
  isStudent: {
    type: Boolean,
    default: true
  },
  bio: {
    type: String,
    default: '',
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  // Champs supplémentaires
  profilePicture: {
    type: String,
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: '',
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  website: {
    type: String,
    default: ''
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Système de rôles cumulatifs (format: "user;premium;moderator;administrator")
  role: {
    type: String,
    default: 'user'
  },
  // Champs pour la gestion du premium temporaire
  premiumExpiresAt: {
    type: Date,
    default: null,
    index: true // Pour optimiser la recherche des premiums expirés
  },
  premiumGrantedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  premiumGrantedAt: {
    type: Date,
    default: null
  },
  // Champs pour le système d'utilisateur supprimé
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  canLogin: {
    type: Boolean,
    default: true
  },
  hideFromSuggestions: {
    type: Boolean,
    default: false
  },
  isSystemAccount: {
    type: Boolean,
    default: false
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  savedPosts: [{
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true
    },
    savedAt: {
      type: Date,
      default: Date.now
    }
  }],
  postsCount: {
    type: Number,
    default: 0
  },
  followersCount: {
    type: Number,
    default: 0
  },
  followingCount: {
    type: Number,
    default: 0
  },
  savedPostsCount: {
    type: Number,
    default: 0
  },
  recentEmojis: {
    type: [String],
    default: [],
    maxlength: 64 // limite de sécurité
  },
  // Paramètres de notifications
  notificationSettings: {
    messages: {
      type: Boolean,
      default: true
    },
    friendRequests: {
      type: Boolean,
      default: true
    },
    newPosts: {
      type: Boolean,
      default: false
    },
    email: {
      type: Boolean,
      default: true
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
  }
}, {
  timestamps: true, // Ajoute createdAt et updatedAt automatiquement
  toJSON: {
    transform: function(doc, ret) {
      // Supprimer le mot de passe des réponses JSON
      delete ret.password;
      return ret;
    }
  }
});

// Index pour optimiser les recherches
// Note: email et username ont déjà un index unique automatique
userSchema.index({ university: 1 });
userSchema.index({ isStudent: 1 });
userSchema.index({ createdAt: -1 });

// Middleware pour mettre à jour les compteurs
userSchema.pre('save', function(next) {
  if (this.isModified('followers')) {
    this.followersCount = this.followers.length;
  }
  if (this.isModified('following')) {
    this.followingCount = this.following.length;
  }
  if (this.isModified('savedPosts')) {
    this.savedPostsCount = this.savedPosts.length;
  }
  next();
});

// Middleware pour s'assurer que les compteurs sont toujours définis
userSchema.pre('save', function(next) {
  if (this.savedPostsCount === undefined || this.savedPostsCount === null) {
    this.savedPostsCount = this.savedPosts ? this.savedPosts.length : 0;
  }
  if (this.followersCount === undefined || this.followersCount === null) {
    this.followersCount = this.followers ? this.followers.length : 0;
  }
  if (this.followingCount === undefined || this.followingCount === null) {
    this.followingCount = this.following ? this.following.length : 0;
  }
  next();
});

// Méthodes pour gérer les rôles cumulatifs (nouveau système string)
userSchema.methods.parseRoles = function() {
  if (!this.role) return ['user'];
  const roles = this.role.split(';').map(r => r.trim()).filter(Boolean);
  
  // S'assurer que 'user' est toujours présent
  if (!roles.includes('user')) {
    roles.unshift('user');
  }
  
  return roles;
};

userSchema.methods.hasRole = function(targetRole) {
  const userRoles = this.parseRoles();
  return userRoles.includes(targetRole);
};

userSchema.methods.addRole = function(newRole) {
  let currentRoles = this.parseRoles();
  
  // S'assurer que 'user' est toujours présent
  if (!currentRoles.includes('user')) {
    currentRoles.unshift('user');
  }
  
  // Ajouter le nouveau rôle s'il n'est pas déjà présent
  if (!currentRoles.includes(newRole)) {
    currentRoles.push(newRole);
  }
  
  // Sérialiser en string avec l'ordre correct
  const roleOrder = ['user', 'premium', 'moderator', 'administrator'];
  const orderedRoles = roleOrder.filter(role => currentRoles.includes(role));
  this.role = orderedRoles.join(';');
  
  return this.parseRoles();
};

userSchema.methods.removeRole = function(roleToRemove) {
  let currentRoles = this.parseRoles();
  
  // Retirer le rôle spécifié
  currentRoles = currentRoles.filter(r => r !== roleToRemove);
  
  // S'assurer que 'user' est toujours présent
  if (!currentRoles.includes('user')) {
    currentRoles.unshift('user');
  }
  
  // Sérialiser en string avec l'ordre correct
  const roleOrder = ['user', 'premium', 'moderator', 'administrator'];
  const orderedRoles = roleOrder.filter(role => currentRoles.includes(role));
  this.role = orderedRoles.join(';');
  
  return this.parseRoles();
};

userSchema.methods.isAdmin = function() {
  return this.hasRole('administrator');
};

userSchema.methods.isModerator = function() {
  return this.hasRole('moderator');
};

userSchema.methods.isPremium = function() {
  // Vérifier si l'utilisateur a le rôle premium
  if (!this.hasRole('premium')) {
    return false;
  }
  
  // Si pas de date d'expiration définie, premium permanent
  if (!this.premiumExpiresAt) {
    return true;
  }
  
  // Vérifier si le premium a expiré
  const now = new Date();
  if (this.premiumExpiresAt <= now) {
    // Premium expiré, le retirer automatiquement
    this.removeRole('premium');
    this.premiumExpiresAt = null;
    this.premiumGrantedBy = null;
    this.premiumGrantedAt = null;
    // Sauvegarder les changements
    this.save().catch(err => console.error('Erreur lors de la suppression du premium expiré:', err));
    return false;
  }
  
  return true;
};

// Méthodes pour gérer le premium temporaire
userSchema.methods.grantPremium = function(durationInDays, grantedBy) {
  this.addRole('premium');
  
  if (durationInDays && durationInDays > 0) {
    // Premium temporaire
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + durationInDays);
    this.premiumExpiresAt = expirationDate;
  } else {
    // Premium permanent
    this.premiumExpiresAt = null;
  }
  
  this.premiumGrantedBy = grantedBy;
  this.premiumGrantedAt = new Date();
  
  return this;
};

userSchema.methods.revokePremium = function() {
  this.removeRole('premium');
  this.premiumExpiresAt = null;
  this.premiumGrantedBy = null;
  this.premiumGrantedAt = null;
  
  return this;
};

userSchema.methods.getPremiumInfo = function() {
  if (!this.hasRole('premium')) {
    return { hasPremium: false };
  }
  
  return {
    hasPremium: true,
    isPermanent: !this.premiumExpiresAt,
    expiresAt: this.premiumExpiresAt,
    grantedBy: this.premiumGrantedBy,
    grantedAt: this.premiumGrantedAt,
    daysRemaining: this.premiumExpiresAt ? 
      Math.max(0, Math.ceil((this.premiumExpiresAt - new Date()) / (1000 * 60 * 60 * 24))) : 
      null
  };
};

// Méthode statique pour nettoyer les premiums expirés
userSchema.statics.cleanupExpiredPremiums = async function() {
  const now = new Date();
  console.log(`🧹 Recherche des premiums expirés avant ${now.toISOString()}...`);
  
  // Trouver les utilisateurs avec premium expiré
  const expiredUsers = await this.find({
    role: { $regex: 'premium' },
    premiumExpiresAt: { $lte: now, $ne: null }
  });
  
  console.log(`📊 Trouvé ${expiredUsers.length} utilisateurs avec premium expiré`);
  
  let modifiedCount = 0;
  
  // Traiter chaque utilisateur individuellement pour un meilleur contrôle
  for (const user of expiredUsers) {
    console.log(`➡️ Nettoyage premium expiré pour ${user.username} (expiré le ${user.premiumExpiresAt.toISOString()})`);
    
    // Supprimer le rôle premium
    user.removeRole('premium');
    
    // Nettoyer les champs premium
    user.premiumExpiresAt = null;
    user.premiumGrantedBy = null;
    user.premiumGrantedAt = null;
    
    await user.save();
    modifiedCount++;
    
    console.log(`✅ Premium nettoyé pour ${user.username}. Nouveaux rôles: ${user.role}`);
  }
  
  return { modifiedCount };
};

// Middleware pre-save pour nettoyer automatiquement les rôles
userSchema.pre('save', function(next) {
  // Si le rôle est défini, s'assurer qu'il est bien formaté
  if (this.role) {
    const cleanedRoles = this.parseRoles();
    const roleOrder = ['user', 'premium', 'moderator', 'administrator'];
    const orderedRoles = roleOrder.filter(role => cleanedRoles.includes(role));
    this.role = orderedRoles.join(';');
  } else {
    this.role = 'user';
  }
  
  // Supprimer l'ancien champ roles s'il existe encore
  if (this.roles !== undefined) {
    this.roles = undefined;
  }
  
  next();
});

module.exports = mongoose.model('User', userSchema);
