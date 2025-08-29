const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const ProfilePicture = require('../models/profilePicture.model');
const TokenService = require('../services/token.service');

console.log('🚀 RAILWAY AUTH CONTROLLER FINAL - NO EMAIL IMPORTS');
console.log('📂 Directory:', __dirname);
console.log('🔥 Railway Import Fix Active');

// ZERO EMAIL SERVICE IMPORTS - FULLY SELF-CONTAINED
class RailwayEmailSimulator {
  constructor() {
    console.log('📧 Railway Email Simulator initialized');
  }
  
  async sendVerificationEmail(user, token) {
    console.log('📨 RAILWAY SIMULATION - Email for:', user.email);
    console.log('🎫 RAILWAY SIMULATION - Token:', token.substring(0, 20) + '...');
    
    return {
      success: true,
      messageId: `railway-sim-${Date.now()}`,
      provider: 'railway-simulation'
    };
  }
}

// INSCRIPTION CONTROLLER - RAILWAY OPTIMIZED
const register = async (req, res) => {
  try {
    console.log('📝 RAILWAY - Registration attempt');
    const { email, username, password, firstName, lastName, university, graduationYear, isStudent, bio } = req.body;

    if (!email || !username || !password || !firstName || !lastName) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Tous les champs obligatoires doivent être remplis'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 8 caractères'
      });
    }

    console.log('🔍 Checking existing user...');
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      console.log('⚠️ User already exists');
      return res.status(400).json({
        success: false,
        message: 'Cet email ou ce nom d\'utilisateur est déjà utilisé'
      });
    }

    console.log('🔐 Hashing password...');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    console.log('👤 Creating user...');
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
      isVerified: false // CRITICAL: Not verified by default
    });

    await newUser.save();
    console.log('✅ User created:', newUser._id.toString());

    // Email simulation
    try {
      console.log('📧 Generating verification token...');
      const verificationToken = await TokenService.generateVerificationToken(newUser._id, 'email_verification');
      
      console.log('📨 Simulating email send...');
      const emailSim = new RailwayEmailSimulator();
      const result = await emailSim.sendVerificationEmail(newUser, verificationToken);
      
      console.log('✅ Email simulation:', result);
      
    } catch (emailError) {
      console.error('⚠️ Email simulation error:', emailError);
    }

    console.log('📤 Sending response...');

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès ! Sur Railway, vérification par simulation.',
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
      railwayNote: 'Simulation mode - manual verification available'
    });

  } catch (error) {
    console.error('❌ RAILWAY REGISTRATION ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'inscription',
      error: error.message
    });
  }
};

// LOGIN CONTROLLER WITH STRICT VERIFICATION BLOCKING
const login = async (req, res) => {
  try {
    console.log('🔐 RAILWAY - Login attempt');
    
    const { emailOrPseudo, emailOrUsername, password, motDePasse } = req.body;
    const emailOrUserField = emailOrPseudo || emailOrUsername;
    const passwordField = motDePasse || password;

    if (!emailOrUserField || !passwordField) {
      return res.status(400).json({
        success: false,
        message: 'Email/pseudo et mot de passe sont obligatoires'
      });
    }

    console.log('🔍 Finding user:', emailOrUserField);
    
    const user = await User.findOne({
      $or: [
        { email: emailOrUserField },
        { username: emailOrUserField }
      ]
    });

    if (!user) {
      console.log('❌ User not found');
      return res.status(400).json({
        success: false,
        message: 'Email/pseudo ou mot de passe incorrect'
      });
    }

    console.log('👤 User found:', user.username);
    console.log('✅ Verification status:', user.isVerified);

    const isPasswordValid = await bcrypt.compare(passwordField, user.password);
    
    if (!isPasswordValid) {
      console.log('❌ Invalid password');
      return res.status(400).json({
        success: false,
        message: 'Email/pseudo ou mot de passe incorrect'
      });
    }

    // CRITICAL VERIFICATION CHECK - BLOCK NON-VERIFIED ACCOUNTS
    if (!user.isVerified) {
      console.log('🚫 RAILWAY - LOGIN BLOCKED - Account not verified:', user.email);
      return res.status(403).json({
        success: false,
        message: 'Compte non vérifié. Sur Railway, vérification par simulation requise.',
        requiresVerification: true,
        needsVerification: true,
        email: user.email,
        railwayNote: 'Email verification required - simulation mode active'
      });
    }

    console.log('✅ RAILWAY - LOGIN AUTHORIZED:', user.username);

    // Generate JWT for verified user
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

    const profilePicture = await ProfilePicture.findOne({ userId: user._id });

    console.log('🎉 Railway login successful');

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
    console.error('❌ RAILWAY LOGIN ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la connexion'
    });
  }
};

// BASIC FUNCTIONS
const logout = (req, res) => {
  console.log('👋 Railway logout');
  res.clearCookie('jurinapse_token');
  res.json({ success: true, message: 'Déconnexion réussie' });
};

const getProfile = (req, res) => {
  res.json({ 
    success: true, 
    user: req.user || {},
    railwayNote: 'Basic profile endpoint' 
  });
};

const updateProfile = (req, res) => {
  res.json({ 
    success: true, 
    message: 'Profile update (Railway placeholder)',
    railwayNote: 'Feature in development'
  });
};

const uploadProfilePicture = (req, res) => {
  res.json({ 
    success: true, 
    message: 'Photo upload (Railway placeholder)',
    railwayNote: 'Feature in development'
  });
};

const getProfilePicture = (req, res) => {
  res.json({ 
    success: true, 
    message: 'Photo fetch (Railway placeholder)',
    railwayNote: 'Feature in development'
  });
};

const deleteProfilePicture = (req, res) => {
  res.json({ 
    success: true, 
    message: 'Photo delete (Railway placeholder)',
    railwayNote: 'Feature in development'
  });
};

const checkUsernameAvailability = async (req, res) => {
  try {
    const { username } = req.params;
    const existingUser = await User.findOne({ username });
    res.json({ 
      success: true, 
      available: !existingUser,
      railwayNote: 'Username availability check'
    });
  } catch (error) {
    res.json({ success: true, available: true });
  }
};

const changePassword = (req, res) => {
  res.json({ 
    success: true, 
    message: 'Password change (Railway placeholder)',
    railwayNote: 'Feature in development'
  });
};

console.log('✅ RAILWAY AUTH CONTROLLER - All functions loaded');

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
