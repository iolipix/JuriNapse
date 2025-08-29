const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const ProfilePicture = require('../models/profilePicture.model');
const TokenService = require('../services/token.service');
const fs = require('fs');
const path = require('path');

// Vérifier si EmailService existe et l'importer conditionnellement
let EmailService;
const emailServicePath = path.join(__dirname, '../services/email.service.js');

if (fs.existsSync(emailServicePath)) {
  try {
    EmailService = require('../services/email.service');
    console.log('✅ EmailService trouvé et importé avec succès');
  } catch (error) {
    console.log('⚠️ Erreur lors de l\'import d\'EmailService:', error.message);
    EmailService = null;
  }
} else {
  console.log('⚠️ Fichier EmailService non trouvé à:', emailServicePath);
  EmailService = null;
}

// Classe EmailService de secours si pas disponible
if (!EmailService) {
  console.log('🔧 Utilisation de EmailService en mode dégradé');
  EmailService = class {
    constructor() {
      console.log('🔧 EmailService en mode dégradé initialisé');
    }
    async sendVerificationEmail(user, token) {
      console.log('📧 Simulation envoi email pour:', user.email);
      console.log('🔗 Token de vérification:', token);
      return { success: true, messageId: 'simulated-fallback' };
    }
  };
}

// Controller pour l'inscription
const register = async (req, res) => {
  try {
    const { email, username, password, firstName, lastName, university, graduationYear, isStudent, bio } = req.body;

    // Validation des champs obligatoires
    if (!email || !username || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs obligatoires doivent être remplis'
      });
    }

    // Validation de la complexité du mot de passe
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 8 caractères'
      });
    }

    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins une majuscule'
      });
    }

    if (!/[a-z]/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins une minuscule'
      });
    }

    if (!/\\d/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins un chiffre'
      });
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*(),.?":{}|<>)'
      });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({
      $or: [
        { email },
        { username }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Cet email ou ce nom d\'utilisateur est déjà utilisé'
      });
    }

    // Hash du mot de passe
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

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
      isVerified: false // Le compte commence non vérifié
    });

    await newUser.save();

    // Générer et envoyer l'email de vérification
    try {
      const verificationToken = await TokenService.generateVerificationToken(newUser._id, 'email_verification');
      const emailService = new EmailService();
      await emailService.sendVerificationEmail(newUser, verificationToken);
      
      console.log(`📧 Email de vérification traité pour ${newUser.email}`);
    } catch (emailError) {
      console.error('⚠️ Erreur email vérification:', emailError);
      // On ne bloque pas l'inscription si l'email échoue
    }

    // Ne pas générer de token JWT pour un compte non vérifié
    // L'utilisateur doit d'abord vérifier son email

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès. Vérifiez votre email pour activer votre compte.',
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
        profilePicture: null, // Pas de photo de profil lors de l'inscription
        joinedAt: newUser.createdAt,
        isVerified: false // Indiquer que le compte n'est pas vérifié
      },
      requiresVerification: true,
      needsVerification: true // Flag pour le frontend
    });

  } catch (error) {
    console.error('❌ Erreur inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'inscription'
    });
  }
};

// Controller pour la connexion
const login = async (req, res) => {
  try {
    const { emailOrPseudo, emailOrUsername, password, motDePasse } = req.body;
    
    // Support des deux formats de champs
    const emailOrUserField = emailOrPseudo || emailOrUsername;
    const passwordField = motDePasse || password;

    // Validation des champs obligatoires
    if (!emailOrUserField || !passwordField) {
      return res.status(400).json({
        success: false,
        message: 'Email/pseudo et mot de passe sont obligatoires'
      });
    }

    // Trouver l'utilisateur par email ou username
    console.log('🔍 DEBUG: Recherche utilisateur avec:', emailOrUserField);
    const user = await User.findOne({
      $or: [
        { email: emailOrUserField },
        { username: emailOrUserField }
      ]
    });

    if (!user) {
      console.log('❌ DEBUG: Aucun utilisateur trouvé pour:', emailOrUserField);
      return res.status(400).json({
        success: false,
        message: 'Email/pseudo ou mot de passe incorrect'
      });
    }

    console.log('👤 DEBUG: Utilisateur trouvé:', user.username, 'ID:', user._id.toString());

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(passwordField, user.password);
    console.log('✅ DEBUG: Validation mot de passe:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('❌ DEBUG: Mot de passe invalide');
      return res.status(400).json({
        success: false,
        message: 'Email/pseudo ou mot de passe incorrect'
      });
    }

    // Vérifier que le compte est activé
    if (!user.isVerified) {
      console.log('⚠️ DEBUG: Compte non vérifié pour:', user.email);
      return res.status(403).json({
        success: false,
        message: 'Compte non vérifié. Vérifiez votre email pour activer votre compte.',
        requiresVerification: true,
        email: user.email
      });
    }

    console.log('🎉 DEBUG: Connexion réussie pour:', user.username);

    // Générer un JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'jurinapse_secret_key',
      { expiresIn: '7d' }
    );

    // Définir le cookie HTTP avec le token
    res.cookie('jurinapse_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
    });

    // Récupérer la photo de profil si elle existe
    const profilePicture = await ProfilePicture.findOne({ userId: user._id });

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
        joinedAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Erreur connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la connexion'
    });
  }
};

// Export des autres fonctions (simplifié pour le debug)
const logout = (req, res) => {
  res.clearCookie('jurinapse_token');
  res.json({ success: true, message: 'Déconnexion réussie' });
};

const getProfile = (req, res) => {
  res.json({ success: true, user: req.user });
};

const updateProfile = (req, res) => {
  res.json({ success: true, message: 'Profil mis à jour (placeholder)' });
};

const uploadProfilePicture = (req, res) => {
  res.json({ success: true, message: 'Photo uploadée (placeholder)' });
};

const getProfilePicture = (req, res) => {
  res.json({ success: true, message: 'Photo récupérée (placeholder)' });
};

const deleteProfilePicture = (req, res) => {
  res.json({ success: true, message: 'Photo supprimée (placeholder)' });
};

const checkUsernameAvailability = (req, res) => {
  res.json({ success: true, available: true });
};

const changePassword = (req, res) => {
  res.json({ success: true, message: 'Mot de passe changé (placeholder)' });
};

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
