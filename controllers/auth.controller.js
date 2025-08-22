const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const ProfilePicture = require('../models/profilePicture.model');

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
      bio: bio || ''
    });

    await newUser.save();

    // Générer un JWT token
    const token = jwt.sign(
      { userId: newUser._id },
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

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
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
        joinedAt: newUser.createdAt
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

// Controller pour uploader une photo de profil
const uploadProfilePicture = async (req, res) => {
  try {
    const ImageOptimizer = require('../utils/imageOptimizer');
    const { imageData, originalName, mimeType, size } = req.body;
    
    // Validation
    if (!imageData || !originalName || !mimeType) {
      return res.status(400).json({
        success: false,
        message: 'Données de l\'image manquantes'
      });
    }
    
    // Vérifier la taille (max 5MB)
    if (size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'L\'image ne doit pas dépasser 5MB'
      });
    }
    
    // Vérifier le type MIME
    if (!mimeType.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        message: 'Le fichier doit être une image'
      });
    }

    // 🚀 OPTIMISATION AUTOMATIQUE AVEC SHARP !
    const optimizedImageData = await ImageOptimizer.optimizeBase64Image(imageData, {
      width: 200,
      height: 200,
      quality: 80
    });
    
    // Supprimer l'ancienne photo de profil si elle existe
    await ProfilePicture.findOneAndDelete({ userId: req.user._id });
    
    // Créer la nouvelle photo de profil avec l'image OPTIMISÉE
    const profilePicture = new ProfilePicture({
      userId: req.user._id,
      imageData: optimizedImageData, // Image optimisée !
      originalName,
      mimeType: 'image/jpeg', // Forcé en JPEG pour la performance
      size: optimizedSize // Nouvelle taille
    });
    
    await profilePicture.save();
    
    // Mettre à jour l'utilisateur avec l'URL de la photo
    const profilePictureUrl = `/api/auth/profile-picture/${req.user._id}`;
    await User.findByIdAndUpdate(req.user._id, { profilePicture: profilePictureUrl });
    
    res.json({
      success: true,
      message: 'Photo de profil mise à jour avec succès',
      profilePictureUrl
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload de la photo de profil'
    });
  }
};

// Controller pour récupérer une photo de profil
const getProfilePicture = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const profilePicture = await ProfilePicture.findOne({ userId });
    
    if (!profilePicture) {
      return res.status(404).json({
        success: false,
        message: 'Photo de profil non trouvée'
      });
    }
    
    // Convertir base64 en buffer
    const imageBuffer = Buffer.from(profilePicture.imageData.split(',')[1], 'base64');
    
    res.set({
      'Content-Type': profilePicture.mimeType,
      'Content-Length': imageBuffer.length,
      'Cache-Control': 'public, max-age=86400' // Cache 24h
    });
    
    res.send(imageBuffer);
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la photo de profil'
    });
  }
};

// Controller pour supprimer une photo de profil
const deleteProfilePicture = async (req, res) => {
  try {
    // Supprimer la photo de profil
    await ProfilePicture.findOneAndDelete({ userId: req.user._id });
    
    // Mettre à jour l'utilisateur
    await User.findByIdAndUpdate(req.user._id, { profilePicture: '' });
    
    res.json({
      success: true,
      message: 'Photo de profil supprimée avec succès'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la photo de profil'
    });
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

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
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
