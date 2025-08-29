// Version ultra-minimaliste pour Railway sans AUCUN import d'EmailService
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const ProfilePicture = require('../models/profilePicture.model');
const TokenService = require('../services/token.service');

console.log('🚀 RAILWAY AUTH CONTROLLER - Version minimaliste chargée');
console.log('📂 Répertoire:', __dirname);

// EmailService complètement simulé pour Railway
class SimulatedEmailService {
  constructor() {
    console.log('📧 EmailService simulé initialisé pour Railway');
  }
  
  async sendVerificationEmail(user, token) {
    console.log('📨 SIMULATION - Envoi email vérification pour:', user.email);
    console.log('🔑 SIMULATION - Token généré:', token.substring(0, 15) + '...');
    
    // Simuler un petit délai
    await new Promise(resolve => setTimeout(resolve, 50));
    
    return {
      success: true,
      messageId: `sim-${Date.now()}`,
      provider: 'railway-simulation',
      note: 'Email simulé - activation manuelle requise'
    };
  }
}

// Controller pour l'inscription
const register = async (req, res) => {
  try {
    console.log('📝 Tentative d\'inscription...');
    const { email, username, password, firstName, lastName, university, graduationYear, isStudent, bio } = req.body;

    // Validation des champs obligatoires
    if (!email || !username || !password || !firstName || !lastName) {
      console.log('❌ Champs manquants');
      return res.status(400).json({
        success: false,
        message: 'Tous les champs obligatoires doivent être remplis'
      });
    }

    // Validation mot de passe (simplifiée)
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 8 caractères'
      });
    }

    console.log('🔍 Vérification utilisateur existant...');
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      console.log('⚠️ Utilisateur déjà existant');
      return res.status(400).json({
        success: false,
        message: 'Cet email ou ce nom d\'utilisateur est déjà utilisé'
      });
    }

    console.log('🔐 Hash du mot de passe...');
    
    // Hash du mot de passe
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    console.log('👤 Création utilisateur...');
    
    // Créer le nouvel utilisateur
    const newUser = new User({
      email,
      username,
      password: hashedPassword,
      firstName,
      lastName,
      university: university || '',
      graduationYear: graduationYear || new Date().getFullYear(),
      isStudent: isStudent !== undefined ? isStudent : true,
      bio: bio || '',
      isVerified: false // IMPORTANT : non vérifié par défaut
    });

    await newUser.save();
    console.log('✅ Utilisateur créé:', newUser._id.toString());

    // Simulation d'envoi d'email
    try {
      console.log('📧 Génération token...');
      const verificationToken = await TokenService.generateVerificationToken(newUser._id, 'email_verification');
      
      console.log('📨 Simulation envoi email...');
      const emailService = new SimulatedEmailService();
      const emailResult = await emailService.sendVerificationEmail(newUser, verificationToken);
      
      console.log('✅ Email simulé:', emailResult);
      
    } catch (emailError) {
      console.error('⚠️ Erreur simulation email:', emailError);
    }

    console.log('📤 Réponse inscription...');

    // Réponse sans JWT (compte non vérifié)
    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès ! Vérification email simulée sur Railway.',
      user: {
        id: newUser._id,
        email: newUser.email,
        username: newUser.username,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        university: newUser.university,
        graduationYear: newUser.graduationYear,
        isStudent: newUser.isStudent,
        bio: newUser.bio,
        profilePicture: null,
        joinedAt: newUser.createdAt,
        isVerified: false
      },
      requiresVerification: true,
      needsVerification: true,
      railwayNote: 'Email simulation active - vérification manuelle possible'
    });

  } catch (error) {
    console.error('❌ ERREUR INSCRIPTION:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'inscription',
      railwayError: error.message
    });
  }
};

// Controller pour la connexion avec BLOCAGE des non-vérifiés
const login = async (req, res) => {
  try {
    console.log('🔐 Tentative de connexion...');
    
    const { emailOrPseudo, emailOrUsername, password, motDePasse } = req.body;
    const emailOrUserField = emailOrPseudo || emailOrUsername;
    const passwordField = motDePasse || password;

    if (!emailOrUserField || !passwordField) {
      return res.status(400).json({
        success: false,
        message: 'Email/pseudo et mot de passe sont obligatoires'
      });
    }

    console.log('🔍 Recherche utilisateur:', emailOrUserField);
    
    const user = await User.findOne({
      $or: [
        { email: emailOrUserField },
        { username: emailOrUserField }
      ]
    });

    if (!user) {
      console.log('❌ Utilisateur introuvable');
      return res.status(400).json({
        success: false,
        message: 'Email/pseudo ou mot de passe incorrect'
      });
    }

    console.log('👤 Utilisateur trouvé:', user.username);
    console.log('✅ Statut vérifié:', user.isVerified);

    const isPasswordValid = await bcrypt.compare(passwordField, user.password);
    
    if (!isPasswordValid) {
      console.log('❌ Mot de passe invalide');
      return res.status(400).json({
        success: false,
        message: 'Email/pseudo ou mot de passe incorrect'
      });
    }

    // ⚠️ VÉRIFICATION CRITIQUE - BLOQUER LES NON VÉRIFIÉS
    if (!user.isVerified) {
      console.log('🚫 CONNEXION BLOQUÉE - Compte non vérifié:', user.email);
      return res.status(403).json({
        success: false,
        message: 'Votre compte n\'est pas encore vérifié. Sur Railway, la vérification est simulée.',
        requiresVerification: true,
        needsVerification: true,
        email: user.email,
        railwayNote: 'Vérification email requise - simulation active'
      });
    }

    console.log('✅ CONNEXION AUTORISÉE:', user.username);

    // Génération JWT pour utilisateur vérifié
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'jurinapse_secret_key',
      { expiresIn: '7d' }
    );

    res.cookie('jurinapse_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // Récupération photo de profil
    const profilePicture = await ProfilePicture.findOne({ userId: user._id });

    console.log('🎉 Connexion réussie');

    res.json({
      success: true,
      message: 'Connexion réussie',
      token: token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        university: user.university,
        graduationYear: user.graduationYear,
        isStudent: user.isStudent,
        bio: user.bio,
        profilePicture: profilePicture ? profilePicture.imageData : null,
        joinedAt: user.createdAt,
        isVerified: true
      }
    });

  } catch (error) {
    console.error('❌ ERREUR CONNEXION:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la connexion'
    });
  }
};

// Fonctions basiques pour éviter les erreurs
const logout = (req, res) => {
  console.log('👋 Déconnexion');
  res.clearCookie('jurinapse_token');
  res.json({ success: true, message: 'Déconnexion réussie' });
};

const getProfile = (req, res) => {
  res.json({ 
    success: true, 
    user: req.user || {},
    railwayNote: 'Profil basique' 
  });
};

const updateProfile = (req, res) => {
  res.json({ 
    success: true, 
    message: 'Mise à jour profil (placeholder Railway)',
    railwayNote: 'Fonctionnalité en cours de développement'
  });
};

const uploadProfilePicture = (req, res) => {
  res.json({ 
    success: true, 
    message: 'Upload photo (placeholder Railway)',
    railwayNote: 'Fonctionnalité en cours de développement'
  });
};

const getProfilePicture = (req, res) => {
  res.json({ 
    success: true, 
    message: 'Photo récupérée (placeholder Railway)',
    railwayNote: 'Fonctionnalité en cours de développement'
  });
};

const deleteProfilePicture = (req, res) => {
  res.json({ 
    success: true, 
    message: 'Photo supprimée (placeholder Railway)',
    railwayNote: 'Fonctionnalité en cours de développement'
  });
};

const checkUsernameAvailability = async (req, res) => {
  try {
    const { username } = req.params;
    const existingUser = await User.findOne({ username });
    res.json({ 
      success: true, 
      available: !existingUser,
      railwayNote: 'Vérification pseudo'
    });
  } catch (error) {
    res.json({ success: true, available: true });
  }
};

const changePassword = (req, res) => {
  res.json({ 
    success: true, 
    message: 'Changement mot de passe (placeholder Railway)',
    railwayNote: 'Fonctionnalité en cours de développement'
  });
};

console.log('✅ RAILWAY AUTH CONTROLLER - Toutes les fonctions définies');

module.exports = {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  uploadProfilePicture,
  getProfilePicture,
  deleteProfilePicture,
  checkUsernameAvailability,
  changePassword
};
