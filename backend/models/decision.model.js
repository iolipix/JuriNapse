const mongoose = require('mongoose');

const DecisionSchema = new mongoose.Schema({
  // Identifiants principaux
  decisionNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },

  // Métadonnées juridiques
  jurisdiction: {
    type: String,
    required: true,
    enum: ['Cour de cassation', 'Conseil d\'État', 'Cour d\'appel', 'Tribunal judiciaire', 'Tribunal de commerce']
  },

  chamber: {
    type: String,
    trim: true
  },

  date: {
    type: Date,
    required: true
  },

  solution: {
    type: String,
    trim: true
  },

  // Identifiants externes
  ecli: {
    type: String,
    trim: true,
    unique: true,
    sparse: true // Permet les valeurs null multiples
  },

  judilibreId: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },

  // Contenu de la décision
  summary: {
    type: String,
    text: true // Index texte pour recherche
  },

  fullText: {
    type: String,
    text: true
  },

  // Métadonnées supplémentaires
  publication: {
    type: String,
    trim: true
  },

  themes: [{
    type: String,
    trim: true
  }],

  // Données techniques
  isPublic: {
    type: Boolean,
    default: true
  },

  source: {
    type: String,
    enum: ['judilibre', 'manual', 'legifrance'],
    default: 'judilibre'
  },

  // Données brutes de l'API (pour référence)
  rawJudilibreData: {
    type: mongoose.Schema.Types.Mixed
  },

  // Métadonnées système
  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Peut être automatique via API
  }
});

// Index composé pour recherche efficace
DecisionSchema.index({ decisionNumber: 1, jurisdiction: 1 });
DecisionSchema.index({ date: -1 });
DecisionSchema.index({ '$**': 'text' }); // Index texte global

// Middleware pour mettre à jour updatedAt
DecisionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Méthode pour formater l'affichage
DecisionSchema.methods.getDisplayTitle = function() {
  return `${this.jurisdiction}, ${this.chamber}, ${this.date.toLocaleDateString('fr-FR')}, ${this.decisionNumber}`;
};

// Méthode pour vérifier si le texte complet est disponible
DecisionSchema.methods.hasFullText = function() {
  return !!(this.fullText && this.fullText.length > 0);
};

module.exports = mongoose.model('Decision', DecisionSchema);