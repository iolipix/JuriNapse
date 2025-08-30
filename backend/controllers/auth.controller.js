const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const ProfilePicture = require('../models/profilePicture.model');
const EmailVerification = require('../models/emailVerification.model');
// const EmailService = require('../services/email.service'); // DÉSACTIVÉ POUR RAILWAY
const crypto = require('crypto');

// Fonction utilitaire pour configurer les cookies JWT
const setJwtCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    // Configuration pour cross-origin HTTPS (Vercel → Railway)
    res.cookie('jurinapse_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
    });
  } else {
    // Configuration pour développement local
    res.cookie('jurinapse_token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
    });
  }
};

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

    if (!/\d/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins un chiffre'
      });
    }

    if (!/[!@#$%^&*(),.?":{}|<>\-]/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*(),.?":{}|<>-)'
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
      emailVerified: false // L'utilisateur doit vérifier son email
    });

    await newUser.save();

    // Générer un code numérique 6 chiffres pour cohérence avec resend/verify
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Enregistrer (upsert) le code (valide 1h max pour rester < purge automatique 1h)
    await EmailVerification.findOneAndUpdate(
      { userId: newUser._id },
      {
        userId: newUser._id,
        email: newUser.email,
        code: verificationCode,
        used: false,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1h
      },
      { upsert: true, new: true }
    );

    // Envoyer l'email réel (avec fallback interne au service)
    try {
      const { sendVerificationEmail } = require('../services/email.service');
      await sendVerificationEmail(newUser.email, verificationCode);
      console.log('📨 Code de vérification initial envoyé à', newUser.email);
    } catch (emailErr) {
      console.error('❌ Échec envoi email vérification (inscription):', emailErr.message);
    }

    // Ne pas générer de token ni connecter l'utilisateur automatiquement
    // L'utilisateur doit d'abord vérifier son email

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès. Vérifiez votre email pour l\'activer.',
      needsVerification: true,
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
        emailVerified: newUser.emailVerified
      }
    });

  } catch (error) {
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
      $and: [
        {
          $or: [
            { email: emailOrUserField },
            { username: emailOrUserField }
          ]
        },
        {
          $or: [
            { isDeleted: { $exists: false } },
            { isDeleted: false },
            { canLogin: true }
          ]
        }
      ]
    });

    if (!user) {
      console.log('❌ DEBUG: Aucun utilisateur trouvé pour:', emailOrUserField);
      return res.status(400).json({
        success: false,
        message: 'Email/pseudo ou mot de passe incorrect'
      });
    }

    // Vérifier si l'utilisateur est supprimé ou ne peut pas se connecter
    if (user.isDeleted && !user.canLogin) {
      console.log('❌ DEBUG: Tentative de connexion sur compte supprimé:', user.username);
      return res.status(400).json({
        success: false,
        message: 'Ce compte n\'est plus accessible'
      });
    }

    console.log('👤 DEBUG: Utilisateur trouvé:', user.username, 'ID:', user._id.toString());
    console.log('🔐 DEBUG: Hash en base:', user.password);
    console.log('🔑 DEBUG: Mot de passe reçu:', passwordField);

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

    // Vérifier si l'email est vérifié
    if (!user.emailVerified) {
      console.log('❌ DEBUG: Email non vérifié pour:', user.email);
      return res.status(403).json({
        success: false,
        message: 'Vous devez vérifier votre email avant de pouvoir vous connecter.',
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
    setJwtCookie(res, token);

    // Récupérer la photo de profil si elle existe
    const profilePicture = await ProfilePicture.findOne({ userId: user._id });

    res.json({
      success: true,
      message: 'Connexion réussie',
      token: token, // Ajouter le token pour les tests API
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
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la connexion'
    });
  }
};

// Controller pour récupérer le profil
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Récupérer la photo de profil si elle existe
    const profilePicture = await ProfilePicture.findOne({ userId: user._id });

    res.json({
      success: true,
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
    res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }
};

// Controller pour mettre à jour le profil
const updateProfile = async (req, res) => {
  try {
    const { username, firstName, lastName, university, graduationYear, isStudent, bio, profilePicture } = req.body;
    
    // Vérifier si le nouveau username est déjà pris (s'il est différent du current)
    if (username && username !== req.user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Ce nom d\'utilisateur est déjà pris'
        });
      }
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        ...(username && { username }),
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(university !== undefined && { university }),
        ...(graduationYear !== undefined && { graduationYear }),
        ...(isStudent !== undefined && { isStudent }),
        ...(bio !== undefined && { bio }),
        ...(profilePicture !== undefined && { profilePicture })
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        username: updatedUser.username,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        university: updatedUser.university,
        graduationYear: updatedUser.graduationYear,
        isStudent: updatedUser.isStudent,
        bio: updatedUser.bio,
        profilePicture: updatedUser.profilePicture,
        joinedAt: updatedUser.createdAt
      }
    });

  } catch (error) {
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour du profil'
    });
  }
};

// Controller pour uploader une photo de profil (méthode embarquée)
const uploadProfilePicture = async (req, res) => {
  try {
    const ImageOptimizer = require('../utils/imageOptimizer');
    const { imageData, originalName, mimeType, size } = req.body;
    if (!imageData || !mimeType) {
      return res.status(400).json({ success: false, message: 'Image manquante' });
    }
    if (!mimeType.startsWith('image/')) {
      return res.status(400).json({ success: false, message: 'Type invalide' });
    }
    if (size && size > 5 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: 'Max 5MB' });
    }
    const optimizedImageData = await ImageOptimizer.optimizeBase64Image(imageData, { width: 200, height: 200, quality: 80 });
    await User.findByIdAndUpdate(req.user._id, { profilePicture: optimizedImageData });
    res.json({ success: true, message: 'Photo de profil mise à jour', profilePicture: optimizedImageData });
  } catch (error) {
    console.error('uploadProfilePicture error:', error.message);
    res.status(500).json({ success: false, message: 'Erreur upload photo' });
  }
};

// Récupération de la photo: on renvoie directement le base64 stocké
const getProfilePicture = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('profilePicture');
    if (!user || !user.profilePicture) {
      return res.status(404).json({ success: false, message: 'Photo non trouvée' });
    }
    res.json({ success: true, profilePicture: user.profilePicture });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur récupération photo' });
  }
};

// Suppression: vider le champ embedded
const deleteProfilePicture = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { profilePicture: '' });
    res.json({ success: true, message: 'Photo de profil supprimée' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur suppression photo' });
  }
};

// Controller pour vérifier la disponibilité du username
const checkUsernameAvailability = async (req, res) => {
  try {
    const { username } = req.params;
    
    // Validation du username
    if (!username || username.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Le nom d\'utilisateur doit contenir au moins 3 caractères'
      });
    }

    // Vérifier si le username est déjà pris
    const existingUser = await User.findOne({ username });
    
    // Si on a un utilisateur connecté, vérifier si c'est son propre username
    const isOwnUsername = req.user && req.user.username === username;
    
    res.json({
      success: true,
      available: !existingUser || isOwnUsername,
      message: existingUser && !isOwnUsername ? 
        'Ce nom d\'utilisateur est déjà pris' : 
        'Ce nom d\'utilisateur est disponible'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du nom d\'utilisateur'
    });
  }
};

// Controller pour la déconnexion
const logout = async (req, res) => {
  try {
    // Supprimer le cookie JWT
    res.clearCookie('jurinapse_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la déconnexion'
    });
  }
};

// Controller pour changer le mot de passe
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Vérification des données
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel et nouveau mot de passe sont obligatoires'
      });
    }

    // Validation du nouveau mot de passe
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit contenir au moins 8 caractères'
      });
    }

    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit contenir au moins une majuscule'
      });
    }

    if (!/[a-z]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit contenir au moins une minuscule'
      });
    }

    if (!/\d/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit contenir au moins un chiffre'
      });
    }

    if (!/[!@#$%^&*(),.?":{}|<>\-]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit contenir au moins un caractère spécial'
      });
    }

    // Récupérer l'utilisateur
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier l'ancien mot de passe
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }

    // Vérifier que le nouveau mot de passe est différent
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit être différent de l\'ancien'
      });
    }

    // Hasher le nouveau mot de passe
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Mettre à jour le mot de passe
    await User.findByIdAndUpdate(req.user._id, {
      password: hashedNewPassword
    });

    res.json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    });

  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du changement de mot de passe'
    });
  }
};

// Service email (Resend > SMTP > log)
const { sendVerificationEmail } = require('../services/email.service');

// Envoyer un code de vérification par email
const sendEmailVerification = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'ID utilisateur requis'
      });
    }

    // Vérifier que l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Générer un code à 6 chiffres
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Sauvegarder ou mettre à jour le code dans la base de données
    await EmailVerification.findOneAndUpdate(
      { userId },
      {
        userId,
        email: user.email,
        code: verificationCode,
        used: false,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
      { upsert: true, new: true }
    );

    // Envoyer l'email
    await sendVerificationEmail(user.email, verificationCode);

    res.json({
      success: true,
      message: 'Code de vérification envoyé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de l\'envoi du code de vérification:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'envoi du code'
    });
  }
};

// Vérifier le code email et activer le compte (accepte userId OU email)
const verifyEmail = async (req, res) => {
  try {
    let { userId, verificationCode, email } = req.body;

    if ((!userId && !email) || !verificationCode) {
      return res.status(400).json({
        success: false,
        message: 'userId ou email + code requis'
      });
    }

    // Récupérer userId à partir de l'email si nécessaire
    if (!userId && email) {
      const userByEmail = await User.findOne({ email: email.toLowerCase() });
      if (!userByEmail) {
        return res.status(400).json({ success: false, message: 'Utilisateur introuvable' });
      }
      userId = userByEmail._id.toString();
    }

    // Chercher le code de vérification (lié à ce userId)
    const verification = await EmailVerification.findOne({
      userId,
      code: verificationCode,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!verification) {
      return res.status(400).json({
        success: false,
        message: 'Code invalide ou expiré'
      });
    }

    // Marquer le code comme utilisé
    verification.used = true;
    await verification.save();

    // Mettre à jour l'utilisateur pour marquer l'email comme vérifié
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ success: false, message: 'Utilisateur introuvable' });
    }
    user.emailVerified = true;
    await user.save();

    // Générer un token JWT pour connecter l'utilisateur
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'jurinapse_secret_key',
      { expiresIn: '7d' }
    );

    // Définir le cookie HTTP avec le token
    setJwtCookie(res, token);

    res.json({
      success: true,
      message: 'Email vérifié avec succès',
      token,
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
        profilePicture: user.profilePicture,
        joinedAt: user.createdAt,
        emailVerified: user.emailVerified
      }
    });

  } catch (error) {
    console.error('Erreur lors de la vérification email:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la vérification'
    });
  }
};

// Renvoyer un email de vérification avec token
const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email requis'
      });
    }

    // Vérifier que l'utilisateur existe et n'est pas déjà vérifié
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Aucun utilisateur trouvé avec cet email'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà vérifié'
      });
    }

    // Supprimer l'ancien enregistrement s'il existe
    await EmailVerification.deleteOne({ userId: user._id });

  // Générer un nouveau code NUMÉRIQUE 6 chiffres (aligné sur sendEmailVerification)
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Créer une nouvelle entrée (réutilise le schéma existant basé sur 'code')
    const emailVerification = new EmailVerification({
      userId: user._id,
      email: user.email,
      code: verificationCode,
      used: false,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h pour le renvoi
    });

    await emailVerification.save();

  // Envoi réel (avec fallback)
  await sendVerificationEmail(user.email, verificationCode);

    res.json({
  success: true,
  message: 'Un nouveau code de vérification a été envoyé à votre email',
  ...(process.env.NODE_ENV !== 'production' && { devCode: verificationCode })
    });

  } catch (error) {
    console.error('Erreur lors du renvoi de vérification:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du renvoi de vérification'
    });
  }
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
  changePassword,
  sendEmailVerification,
  verifyEmail,
  resendVerificationEmail
};
